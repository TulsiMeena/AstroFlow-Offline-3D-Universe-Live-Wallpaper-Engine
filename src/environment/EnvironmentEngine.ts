import * as THREE from 'three';
import { EnvironmentDNA, TimeOfDay, WeatherType } from './types/environmentDNA';
import { QualityConfig, TouchPointerState, MotionData } from '../types/engine';
import { PRNG } from './seed/PRNG';
import { EnvironmentGenerator, GeneratedEnvironment } from './EnvironmentGenerator';
import { WeatherEngine } from './weather/WeatherEngine';
import { TimeOfDayEngine } from './time/TimeOfDayEngine';
import { EnvironmentTransitionManager } from './EnvironmentTransitionManager';
import { EnvironmentDNAFactory } from './EnvironmentDNA';
import { LivingWorldEngine } from '../living/LivingWorldEngine';

export class EnvironmentEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private quality: QualityConfig;

  private currentEnvironment: GeneratedEnvironment | null = null;
  private weatherEngine: WeatherEngine;
  private timeOfDayEngine: TimeOfDayEngine;
  private transitionManager: EnvironmentTransitionManager;
  private livingWorldEngine: LivingWorldEngine;

  private activeDNA: EnvironmentDNA;
  private cameraAngle: number = 0;
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3(0, 1.5, 0);

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    quality: QualityConfig,
    initialDNA?: EnvironmentDNA
  ) {
    this.scene = scene;
    this.camera = camera;
    this.quality = quality;
    this.activeDNA = initialDNA || EnvironmentDNAFactory.createDefault('living-forest', 42);

    this.transitionManager = new EnvironmentTransitionManager();
    this.timeOfDayEngine = new TimeOfDayEngine(this.activeDNA.timeOfDay, this.activeDNA.timeCycleSpeed);

    // Living World Engine
    this.livingWorldEngine = new LivingWorldEngine(
      this.scene,
      this.camera,
      this.quality,
      this.activeDNA
    );

    // Add lights to scene
    this.scene.add(this.timeOfDayEngine.getSunLight());
    this.scene.add(this.timeOfDayEngine.getAmbientLight());

    // Setup initial fog
    this.scene.fog = new THREE.FogExp2(
      new THREE.Color(this.activeDNA.atmosphere.fogColor),
      this.activeDNA.atmosphere.fogDensity
    );

    // Weather engine
    this.weatherEngine = new WeatherEngine(
      this.activeDNA.weather,
      this.quality,
      new PRNG(this.activeDNA.seed || 1337)
    );
    this.scene.add(this.weatherEngine.getGroup());

    // Celestial
    this.timeOfDayEngine.buildCelestial(this.scene, this.activeDNA.atmosphere);

    // Generate initial environment
    this.loadEnvironment(this.activeDNA, false);
  }

  public getActiveDNA(): EnvironmentDNA {
    return this.activeDNA;
  }

  public loadEnvironment(dna: EnvironmentDNA, smoothTransition: boolean = true) {
    const newEnv = EnvironmentGenerator.generate(dna, this.quality);
    this.activeDNA = dna;

    if (smoothTransition && this.currentEnvironment) {
      this.scene.add(newEnv.rootGroup);
      this.transitionManager.startTransition(this.currentEnvironment, newEnv, 1.2, () => {
        this.scene.remove(this.currentEnvironment!.rootGroup);
        this.currentEnvironment = newEnv;
      });
    } else {
      if (this.currentEnvironment) {
        this.scene.remove(this.currentEnvironment.rootGroup);
        this.currentEnvironment.dispose();
      }
      this.currentEnvironment = newEnv;
      this.scene.add(this.currentEnvironment.rootGroup);
    }

    // Update time of day & weather
    this.timeOfDayEngine.setTimeOfDay(dna.timeOfDay);
    this.timeOfDayEngine.setCycleSpeed(dna.timeCycleSpeed);
    this.weatherEngine.setWeather(dna.weather);

    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.density = dna.atmosphere.fogDensity;
      this.scene.fog.color.set(dna.atmosphere.fogColor);
    }

    if (this.livingWorldEngine) {
      this.livingWorldEngine.setEnvironmentDNA(dna);
    }
  }

  public getLivingWorldEngine(): LivingWorldEngine {
    return this.livingWorldEngine;
  }

  public setTimeOfDay(time: TimeOfDay) {
    this.activeDNA.timeOfDay = time;
    this.timeOfDayEngine.setTimeOfDay(time);
    if (this.livingWorldEngine) {
      this.livingWorldEngine.getTimeSimulation().setTimeByPhase(time);
    }
  }

  public setWeatherType(type: WeatherType) {
    this.activeDNA.weather.type = type;
    this.weatherEngine.setWeather(this.activeDNA.weather);
  }

  public update(
    time: number,
    delta: number,
    input?: TouchPointerState,
    motion?: MotionData
  ) {
    // 1. Process transitions
    this.transitionManager.update(delta);

    // 2. Weather & Lightning
    this.weatherEngine.update(time, delta);
    const lightning = this.weatherEngine.getLightningIntensity();

    // 3. Time of Day & Lighting
    this.timeOfDayEngine.update(delta, this.scene, this.activeDNA.atmosphere, lightning);

    // 4. Update procedural environment objects (waves, trees sway, traffic streaks, crystals, fractals)
    if (this.currentEnvironment) {
      this.currentEnvironment.update(time, delta, this.activeDNA.weather.windSpeed);
    }

    // 5. Living World Engine (Time simulation, ecosystem entities, events, touch & motion)
    if (this.livingWorldEngine) {
      this.livingWorldEngine.update(time, delta, input, motion);
    }

    // 6. Dynamic Camera Behavior
    this.updateCamera(time, delta, input, motion);
  }

  private updateCamera(
    time: number,
    delta: number,
    input?: TouchPointerState,
    motion?: MotionData
  ) {
    const camConfig = this.activeDNA.camera;
    const parallaxStrength = this.activeDNA.physics.motionParallaxMultiplier || 1.0;

    // Gyro / Pointer offset
    let offsetX = 0;
    let offsetY = 0;
    if (input && input.isDown) {
      offsetX = input.x * 2.5;
      offsetY = input.y * 1.5;
    } else if (motion && motion.isAvailable) {
      offsetX = motion.tiltX * 1.5 * parallaxStrength;
      offsetY = motion.tiltY * 1.0 * parallaxStrength;
    }

    switch (camConfig.behavior) {
      case 'cinematic-orbit': {
        this.cameraAngle += delta * 0.15;
        const dist = camConfig.distance;
        this.camera.position.x = Math.sin(this.cameraAngle) * dist + offsetX;
        this.camera.position.z = Math.cos(this.cameraAngle) * dist;
        this.camera.position.y = camConfig.height + Math.sin(time * 0.5) * 0.3 - offsetY;
        this.camera.lookAt(this.cameraLookTarget);
        break;
      }
      case 'fly-through': {
        const flyZ = ((time * 1.5) % 30) - 15;
        this.camera.position.set(offsetX * 1.2, camConfig.height - offsetY, flyZ);
        this.camera.lookAt(offsetX * 0.5, camConfig.height * 0.8, flyZ + 8);
        break;
      }
      case 'gentle-sway':
      case 'floating-observer':
      case 'dynamic-parallex':
      default: {
        const dist = camConfig.distance;
        this.camera.position.x = Math.sin(time * 0.3) * 0.8 + offsetX;
        this.camera.position.z = dist + Math.cos(time * 0.25) * 0.5;
        this.camera.position.y = camConfig.height + Math.sin(time * 0.4) * 0.4 - offsetY;
        this.camera.lookAt(this.cameraLookTarget);
        break;
      }
    }
  }

  public onResize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public onQualityChange(quality: QualityConfig) {
    this.quality = quality;
    if (this.livingWorldEngine) {
      this.livingWorldEngine.onQualityChange(quality);
    }
    // Reload environment to adapt detail count to new quality
    this.loadEnvironment(this.activeDNA, false);
  }

  public dispose() {
    if (this.livingWorldEngine) {
      this.livingWorldEngine.dispose();
    }
    if (this.currentEnvironment) {
      this.scene.remove(this.currentEnvironment.rootGroup);
      this.currentEnvironment.dispose();
      this.currentEnvironment = null;
    }
    this.weatherEngine.dispose();
    this.timeOfDayEngine.dispose(this.scene);
  }
}
