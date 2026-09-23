import * as THREE from 'three';
import { QualityConfig, TouchPointerState, MotionData } from '../types/engine';
import { EcosystemDNA, EcosystemDNAFactory } from './EcosystemDNA';
import { WorldTimeSimulation, WorldTimeState } from './WorldTimeSimulation';
import { EcosystemEngine } from './EcosystemEngine';
import { WorldEventEngine, WorldEventType, ActiveWorldEvent } from './WorldEventEngine';
import { WorldStateManager, SavedWorldPreset } from './WorldStateManager';
import { EnvironmentDNA, TimeOfDay, WeatherType } from '../environment/types/environmentDNA';
import { EnvironmentDNAFactory } from '../environment/EnvironmentDNA';

export class LivingWorldEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private quality: QualityConfig;

  private ecosystemDNA: EcosystemDNA;
  private environmentDNA: EnvironmentDNA;

  private timeSimulation: WorldTimeSimulation;
  private ecosystemEngine: EcosystemEngine;
  private eventEngine: WorldEventEngine;
  private stateManager: WorldStateManager;

  private livingWorldEnabled: boolean = true;
  private cameraBasePosition: THREE.Vector3 = new THREE.Vector3();
  private shakeOffset: THREE.Vector3 = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    quality: QualityConfig,
    envDNA: EnvironmentDNA,
    ecoDNA?: EcosystemDNA
  ) {
    this.scene = scene;
    this.camera = camera;
    this.quality = quality;
    this.environmentDNA = envDNA;
    this.ecosystemDNA =
      ecoDNA || EcosystemDNAFactory.createDefault(envDNA.biome, envDNA.seed || 1337);

    this.stateManager = WorldStateManager.getInstance();
    this.timeSimulation = new WorldTimeSimulation(envDNA.timeOfDay, 120.0);
    this.ecosystemEngine = new EcosystemEngine(this.quality, this.ecosystemDNA);
    this.eventEngine = new WorldEventEngine(this.quality);

    // Attach to scene
    this.scene.add(this.ecosystemEngine.getGroup());
    this.scene.add(this.eventEngine.getGroup());

    this.cameraBasePosition.copy(this.camera.position);
  }

  public isLivingWorldEnabled(): boolean {
    return this.livingWorldEnabled;
  }

  public setLivingWorldEnabled(enabled: boolean) {
    this.livingWorldEnabled = enabled;
    this.ecosystemEngine.getGroup().visible = enabled;
    this.eventEngine.getGroup().visible = enabled;
  }

  public setEcosystemEnabled(enabled: boolean) {
    this.ecosystemDNA.ecosystemEnabled = enabled;
    this.ecosystemEngine.setDNA(this.ecosystemDNA);
  }

  public getEcosystemEngine(): EcosystemEngine {
    return this.ecosystemEngine;
  }

  public getEventEngine(): WorldEventEngine {
    return this.eventEngine;
  }

  public getTimeSimulation(): WorldTimeSimulation {
    return this.timeSimulation;
  }

  public getEcosystemDNA(): EcosystemDNA {
    return this.ecosystemDNA;
  }

  public setEcosystemDNA(dna: EcosystemDNA) {
    this.ecosystemDNA = dna;
    this.ecosystemEngine.setDNA(dna);
  }

  public setEnvironmentDNA(envDNA: EnvironmentDNA) {
    this.environmentDNA = envDNA;
    this.timeSimulation.setTimeByPhase(envDNA.timeOfDay);
    const updatedEco = EcosystemDNAFactory.createDefault(envDNA.biome, envDNA.seed || 1337);
    this.ecosystemDNA = updatedEco;
    this.ecosystemEngine.setDNA(updatedEco);
  }

  /**
   * Generates a completely new deterministic living world with synchronized seeds.
   */
  public generateNewWorld(seed: number = Math.floor(Math.random() * 999999)): {
    envDNA: EnvironmentDNA;
    ecoDNA: EcosystemDNA;
  } {
    const biomes = [
      'living-forest',
      'ocean-world',
      'cyber-city',
      'volcano-world',
      'crystal-world',
      'aurora-world',
      'snow-world',
      'floating-islands'
    ] as const;
    const randomBiome = biomes[Math.floor(Math.random() * biomes.length)];
    const newEnv = EnvironmentDNAFactory.getPresetByBiome(randomBiome, seed);
    const newEco = EcosystemDNAFactory.randomize(seed, randomBiome);

    this.environmentDNA = newEnv;
    this.ecosystemDNA = newEco;
    this.ecosystemEngine.setDNA(newEco);
    this.timeSimulation.setTimeByPhase(newEnv.timeOfDay);

    return { envDNA: newEnv, ecoDNA: newEco };
  }

  /**
   * Re-simulates the living world with current seed and parameters.
   */
  public simulateWorld() {
    this.timeSimulation.resetTime();
    this.ecosystemEngine.setDNA(this.ecosystemDNA);
    this.eventEngine.triggerRandomEvent();
  }

  public saveWorld(customName?: string): SavedWorldPreset {
    const name = customName || `${this.environmentDNA.name} Living World`;
    return this.stateManager.saveWorld(
      name,
      this.environmentDNA,
      this.ecosystemDNA,
      this.timeSimulation.getHour(),
      this.environmentDNA.weather.type
    );
  }

  public loadWorldPreset(preset: SavedWorldPreset) {
    this.environmentDNA = preset.environmentDNA;
    this.ecosystemDNA = preset.ecosystemDNA;
    this.ecosystemEngine.setDNA(preset.ecosystemDNA);
    this.timeSimulation.setHour(preset.timeHour);
  }

  // Timeline & Time controls
  public pauseWorld() {
    this.timeSimulation.setPaused(true);
  }

  public resumeWorld() {
    this.timeSimulation.setPaused(false);
  }

  public fastTime() {
    this.timeSimulation.fastForward();
  }

  public slowTime() {
    this.timeSimulation.slowTime();
  }

  public resetWorld() {
    this.timeSimulation.resetTime();
    this.timeSimulation.normalTime();
  }

  public triggerRandomEvent(): ActiveWorldEvent {
    return this.eventEngine.triggerRandomEvent();
  }

  public triggerEvent(type: WorldEventType): ActiveWorldEvent {
    return this.eventEngine.triggerEvent(type);
  }

  public update(
    time: number,
    delta: number,
    input?: TouchPointerState,
    motion?: MotionData
  ): { timeState: WorldTimeState; activeEvents: ActiveWorldEvent[] } {
    // 1. Advance Continuous Simulated World Clock
    const timeState = this.timeSimulation.update(delta);

    // Synchronize environmentDNA timeOfDay with simulation
    this.environmentDNA.timeOfDay = timeState.phase;

    if (!this.livingWorldEnabled) {
      return { timeState, activeEvents: [] };
    }

    // 2. Advance Procedural World Events & Camera Trauma
    const shake = this.eventEngine.update(time, delta, this.ecosystemDNA.eventFrequency);
    if (shake.lengthSq() > 0.0001) {
      this.camera.position.add(shake);
    }

    // 3. Advance Ecosystem Entities & Behaviors
    this.ecosystemEngine.update(
      time,
      delta,
      this.camera,
      timeState.phase,
      timeState.daylight,
      this.environmentDNA.weather.type,
      this.environmentDNA.weather.windSpeed,
      input,
      motion
    );

    return {
      timeState,
      activeEvents: this.eventEngine.getActiveEvents()
    };
  }

  public onQualityChange(quality: QualityConfig) {
    this.quality = quality;
    this.ecosystemEngine.setQuality(quality);
  }

  public dispose() {
    this.scene.remove(this.ecosystemEngine.getGroup());
    this.scene.remove(this.eventEngine.getGroup());
    this.ecosystemEngine.dispose();
    this.eventEngine.dispose();
  }
}
