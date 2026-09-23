import * as THREE from 'three';
import { QualityConfig, TouchPointerState, MotionData } from '../types/engine';
import { PhysicsConfig, PhysicsEngineStats, PhysicsPresetType, ForceFieldType } from './types';
import { PhysicsPresetManager } from './PhysicsPresetManager';
import { PhysicsWorld } from './PhysicsWorld';
import { ForceFieldManager } from './ForceFieldManager';
import { CollisionManager } from './CollisionManager';
import { ParticlePhysicsSystem } from './ParticlePhysicsSystem';
import { FluidReactionSystem } from './FluidReactionSystem';
import { ClothRibbonReactionSystem } from './ClothRibbonReactionSystem';
import { GravitySystem } from './GravitySystem';
import { WindSystem } from './WindSystem';
import { ShockwaveSystem } from './ShockwaveSystem';
import { InteractionReactionManager } from './InteractionReactionManager';

export class PhysicsEngine {
  private static instance: PhysicsEngine | null = null;

  private group: THREE.Group;
  private scene: THREE.Scene | null = null;
  private quality: QualityConfig;

  // 12 Core Subsystems
  public readonly presetManager: PhysicsPresetManager;
  public readonly world: PhysicsWorld;
  public readonly forceFields: ForceFieldManager;
  public readonly collision: CollisionManager;
  public readonly particles: ParticlePhysicsSystem;
  public readonly fluid: FluidReactionSystem;
  public readonly ribbons: ClothRibbonReactionSystem;
  public readonly gravity: GravitySystem;
  public readonly wind: WindSystem;
  public readonly shockwaves: ShockwaveSystem;
  public readonly interactions: InteractionReactionManager;

  private stats: PhysicsEngineStats = {
    activeBodies: 0,
    activeForceFields: 0,
    activeShockwaves: 0,
    particleCount: 0,
    fluidGridResolution: '48x48',
    ribbonNodes: 0,
    stepTimeMs: 0,
  };

  private listeners: ((config: PhysicsConfig) => void)[] = [];

  constructor(quality?: QualityConfig, initialPreset: PhysicsPresetType = 'cosmic') {
    this.group = new THREE.Group();
    this.group.name = 'Amit_HyperWall_PhysicsEngine_Root';

    this.quality = quality || {
      profile: 'HIGH',
      resolutionScale: 1.0,
      maxParticleCount: 2400,
      shadows: true,
      bloomEnabled: true,
      postProcessing: true,
      animationComplexity: 1.0,
      antialias: true,
    };

    // Instantiate all 12 modules
    this.presetManager = new PhysicsPresetManager(initialPreset);
    const config = this.presetManager.getConfig();

    this.world = new PhysicsWorld();
    this.forceFields = new ForceFieldManager();
    this.collision = new CollisionManager();
    this.particles = new ParticlePhysicsSystem(this.quality);
    this.fluid = new FluidReactionSystem(this.quality, config.fluidMode);
    this.ribbons = new ClothRibbonReactionSystem(this.quality);
    this.gravity = new GravitySystem(config.gravityMode, config.gravityStrength);
    this.wind = new WindSystem(config.windDirectionAngle, config.windStrength, config.turbulence);
    this.shockwaves = new ShockwaveSystem();
    this.interactions = new InteractionReactionManager(config.interactionStrength);

    // Add sub-groups to master physics group
    this.group.add(this.particles.getGroup());
    this.group.add(this.fluid.getGroup());
    this.group.add(this.ribbons.getGroup());
    this.group.add(this.shockwaves.getGroup());
    this.group.add(this.forceFields.getDebugGroup());
    this.group.add(this.collision.getDebugGroup());

    // Apply initial config
    this.applyConfig(config);

    PhysicsEngine.instance = this;
  }

  public static getInstance(quality?: QualityConfig): PhysicsEngine {
    if (!PhysicsEngine.instance) {
      PhysicsEngine.instance = new PhysicsEngine(quality);
    }
    return PhysicsEngine.instance;
  }

  public attachToScene(scene: THREE.Scene): void {
    this.scene = scene;
    if (!scene.children.includes(this.group)) {
      scene.add(this.group);
    }
  }

  public detachFromScene(): void {
    if (this.scene && this.scene.children.includes(this.group)) {
      this.scene.remove(this.group);
    }
    this.scene = null;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public subscribe(callback: (config: PhysicsConfig) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners(): void {
    const cfg = this.presetManager.getConfig();
    this.listeners.forEach((cb) => cb(cfg));
  }

  public getConfig(): PhysicsConfig {
    return this.presetManager.getConfig();
  }

  public setPreset(preset: PhysicsPresetType): void {
    const config = this.presetManager.applyPreset(preset);
    this.applyConfig(config);
    this.notifyListeners();
  }

  public updateConfig(partial: Partial<PhysicsConfig>): void {
    const config = this.presetManager.updateConfig(partial);
    this.applyConfig(config);
    this.notifyListeners();
  }

  public randomizePhysics(): void {
    const config = this.presetManager.randomize();
    this.applyConfig(config);
    this.notifyListeners();
  }

  public resetPhysics(): void {
    const config = this.presetManager.resetCurrentPreset();
    this.applyConfig(config);
    this.notifyListeners();
  }

  private applyConfig(config: PhysicsConfig): void {
    this.gravity.setMode(config.gravityMode);
    this.gravity.setStrength(config.gravityStrength);

    this.wind.setAngle(config.windDirectionAngle);
    this.wind.setStrength(config.windStrength);
    this.wind.setTurbulence(config.turbulence);

    this.interactions.setStrength(config.interactionStrength);
    this.fluid.setMode(config.fluidMode);

    this.forceFields.setDebugVisuals(config.debugVisuals);
    this.collision.setDebugVisuals(config.debugVisuals);

    this.fluid.getGroup().visible = config.fluidReaction;
    this.ribbons.getGroup().visible = config.ribbonReaction;
  }

  public onQualityChange(quality: QualityConfig): void {
    this.quality = quality;
    this.particles.configureQuality(quality);
  }

  /**
   * Main simulation tick
   */
  public update(
    delta: number,
    time: number,
    input: TouchPointerState,
    motion: MotionData
  ): void {
    const config = this.presetManager.getConfig();
    if (!config.enabled) return;

    const start = performance.now();
    const simSpeed = config.simulationSpeed;

    // 1. Interactions (Touch + Phone Motion)
    this.interactions.process(
      input,
      motion,
      delta,
      time,
      this.forceFields,
      this.shockwaves,
      this.fluid,
      this.particles,
      this.gravity,
      this.wind
    );

    // 2. Wind simulation
    this.wind.update(delta * simSpeed, motion);

    // 3. Force fields lifecycle
    this.forceFields.update(delta * simSpeed);

    // 4. Shockwaves lifecycle & visual rings
    this.shockwaves.update(delta * simSpeed);

    // 5. Dynamic bodies world step
    if (config.objectReaction) {
      this.world.step(
        delta,
        time,
        this.gravity,
        this.wind,
        this.forceFields,
        this.shockwaves,
        this.collision,
        simSpeed
      );
    }

    // 6. Particle physics simulation
    this.particles.update(
      delta,
      time,
      this.forceFields,
      this.gravity,
      this.wind,
      this.shockwaves,
      this.collision,
      config.drag,
      simSpeed
    );

    // 7. Fluid reaction simulation
    if (config.fluidReaction) {
      this.fluid.update(delta * simSpeed, time, motion);
    }

    // 8. Cloth & Ribbon simulation
    if (config.ribbonReaction) {
      this.ribbons.update(
        delta * simSpeed,
        time,
        this.gravity,
        this.wind,
        this.forceFields,
        this.shockwaves,
        motion
      );
    }

    const elapsed = performance.now() - start;

    // Update stats
    this.stats.activeBodies = this.world.getAllBodies().length;
    this.stats.activeForceFields = this.forceFields.getAllFields().length;
    this.stats.activeShockwaves = this.shockwaves.getActiveShockwaves().length;
    this.stats.particleCount = this.particles.getActiveCount();
    this.stats.ribbonNodes = this.ribbons.getNodeCount();
    this.stats.stepTimeMs = Number(elapsed.toFixed(2));
  }

  public getStats(): PhysicsEngineStats {
    return { ...this.stats };
  }

  // --- External Reaction Integration Helpers ---

  /**
   * Trigger procedural shockwave from user UI or world event
   */
  public triggerShockwave(origin?: THREE.Vector3, strength?: number, maxRadius?: number) {
    const pos = origin || new THREE.Vector3(0, 0, 0);
    const cfg = this.presetManager.getConfig();
    return this.shockwaves.triggerShockwave({
      origin: pos,
      strength: strength ?? 3.0,
      maxRadius: maxRadius ?? cfg.shockwaveRadius,
      color: 0x00f0ff,
    });
  }

  /**
   * Create a manual custom force field
   */
  public createForceField(
    type: ForceFieldType = 'vortex',
    position?: THREE.Vector3,
    strength?: number,
    radius?: number
  ) {
    const pos = position || new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, 0);
    return this.forceFields.addForceField({
      type,
      position: pos,
      strength: strength ?? 2.5,
      radius: radius ?? 8.0,
      lifetime: 8.0,
      color: 0xd946ef,
    });
  }

  /**
   * Connect world events from Prompt 6 (meteor shower, earthquake, lightning storm, etc.)
   */
  public handleWorldEvent(eventType: string, origin?: THREE.Vector3): void {
    const pos = origin || new THREE.Vector3((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8);

    switch (eventType) {
      case 'meteor-shower':
      case 'meteor-impact':
        this.shockwaves.triggerShockwave({
          origin: pos,
          strength: 4.5,
          maxRadius: 22.0,
          color: 0xffaa00,
        });
        this.forceFields.addForceField({
          type: 'repulsion',
          position: pos,
          strength: 3.5,
          radius: 12.0,
          lifetime: 3.0,
          color: 0xff5500,
        });
        this.fluid.addDisturbance(pos.x, pos.z, 2.0, 4.0);
        this.particles.emitAt(pos, 40, 0xff7700);
        break;

      case 'portal-opening':
        this.forceFields.addForceField({
          type: 'vortex',
          position: pos,
          strength: 4.0,
          radius: 14.0,
          angularVelocity: 4.0,
          lifetime: 5.0,
          color: 0xd946ef,
        });
        this.fluid.addVortex(pos.x, pos.z, 1.5, 3.5);
        this.particles.emitAt(pos, 35, 0xd946ef);
        break;

      case 'black-hole-pulse':
      case 'black-hole':
        this.forceFields.addForceField({
          type: 'gravity',
          position: pos,
          strength: 6.0,
          radius: 18.0,
          lifetime: 4.0,
          color: 0x4a00e0,
        });
        this.shockwaves.triggerShockwave({
          origin: pos,
          strength: 4.0,
          maxRadius: 20.0,
          color: 0x8e2de2,
        });
        break;

      case 'lightning-storm':
      case 'lightning-strike':
        this.shockwaves.triggerShockwave({
          origin: pos,
          strength: 3.0,
          maxRadius: 15.0,
          color: 0x00f0ff,
        });
        this.wind.triggerEventGust(3.0, 2.0);
        this.fluid.addDisturbance(pos.x, pos.z, 1.2, 2.5);
        this.particles.emitAt(pos, 25, 0x00ffff);
        break;

      case 'volcanic-eruption':
        this.forceFields.addForceField({
          type: 'impulse',
          position: pos,
          strength: 5.0,
          radius: 12.0,
          direction: new THREE.Vector3(0, 1, 0),
          lifetime: 4.0,
          color: 0xff2200,
        });
        this.shockwaves.triggerShockwave({
          origin: pos,
          strength: 3.8,
          maxRadius: 18.0,
          color: 0xff3300,
        });
        this.particles.emitAt(pos, 50, 0xff4400);
        break;

      case 'heavy-rain':
        this.fluid.addDisturbance(pos.x, pos.z, 0.8, 2.0);
        break;

      case 'strong-wind':
      case 'storm-gust':
        this.wind.triggerEventGust(3.5, 3.0);
        break;

      case 'energy-wave':
      case 'energy-explosion':
        this.shockwaves.triggerShockwave({
          origin: pos,
          strength: 3.5,
          maxRadius: 16.0,
          color: 0x00ffa3,
        });
        this.forceFields.addForceField({
          type: 'repulsion',
          position: pos,
          strength: 4.0,
          radius: 12.0,
          lifetime: 2.0,
          color: 0x00ffa3,
        });
        this.particles.emitAt(pos, 30, 0x00ffa3);
        break;
    }
  }

  public dispose(): void {
    this.detachFromScene();
    this.forceFields.clear();
    this.collision.clear();
    this.shockwaves.clear();
    this.world.clear();
    this.interactions.clear();
  }
}
