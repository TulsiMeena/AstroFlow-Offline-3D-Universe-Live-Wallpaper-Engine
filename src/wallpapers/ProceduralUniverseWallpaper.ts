import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { WorldDNA } from '../universe/types/worldDNA';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { UniverseStorage } from '../universe/storage/universeStorage';
import { StarFieldGenerator } from '../universe/generators/StarFieldGenerator';
import { GalaxyGenerator } from '../universe/generators/GalaxyGenerator';
import { NebulaGenerator } from '../universe/generators/NebulaGenerator';
import { SolarSystemGenerator } from '../universe/generators/SolarSystemGenerator';
import { BlackHoleGenerator } from '../universe/generators/BlackHoleGenerator';
import { EventManager } from '../universe/events/EventManager';
import { GravityField } from '../universe/physics/GravityField';

export class ProceduralUniverseWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'procedural-universe',
    title: 'Custom Procedural Universe',
    subtitle: 'Living DNA-Generated Cosmos',
    category: 'Cosmic Universes',
    description: 'Dynamic universe assembled in real-time from custom WorldDNA parameters, featuring multi-tiered star fields, planetary mechanics, galaxies, and cosmic events.',
    author: 'Amit Meena',
    tags: ['Procedural', 'WorldDNA', 'Galaxy', 'Solar System', 'Black Hole'],
    accentColor: '#00F0FF',
    secondaryColor: '#7000FF',
    interactive: true,
    proceduralType: 'universe'
  };

  private currentDNA: WorldDNA | null = null;

  constructor(customDNA?: WorldDNA) {
    super();
    if (customDNA) {
      this.currentDNA = customDNA;
    }
  }
  private starfield: { group: THREE.Group; update: (t: number, d: number, i?: any, m?: any) => void; triggerShootingStar: () => void; dispose: () => void } | null = null;
  private galaxy: { group: THREE.Group; update: (t: number, d: number) => void; dispose: () => void } | null = null;
  private nebula: { group: THREE.Group; update: (t: number, d: number) => void; pulseGlow: (s: number) => void; dispose: () => void } | null = null;
  private solarSystem: { group: THREE.Group; update: (t: number, d: number) => void; pulseSunFlare: () => void; dispose: () => void } | null = null;
  private blackHole: { group: THREE.Group; update: (t: number, d: number) => void; dispose: () => void } | null = null;
  private eventManager: EventManager | null = null;
  private gravityField: GravityField | null = null;

  // Dynamic gravity test particles
  private dynamicParticlesGeo: THREE.BufferGeometry | null = null;
  private dynamicParticlesMat: THREE.PointsMaterial | null = null;
  private dynamicPositions: Float32Array | null = null;
  private dynamicVelocities: Float32Array | null = null;
  private dynamicParticleCount: number = 0;

  protected buildScene(): void {
    const dna = this.currentDNA ?? UniverseStorage.getActiveDNA();
    this.currentDNA = dna;
    const rng = new SeededRNG(dna.seed);

    // Event Manager
    if (this.scene) {
      this.eventManager = new EventManager(dna);
      this.eventManager.setScene(this.scene);

      this.eventManager.on('meteor-shower', () => {
        if (this.starfield) {
          this.starfield.triggerShootingStar();
          setTimeout(() => this.starfield?.triggerShootingStar(), 400);
          setTimeout(() => this.starfield?.triggerShootingStar(), 800);
        }
      });

      this.eventManager.on('nebula-pulse', e => {
        if (this.nebula) this.nebula.pulseGlow(e.intensity);
      });

      this.eventManager.on('solar-flare', () => {
        if (this.solarSystem) this.solarSystem.pulseSunFlare();
      });
    }

    // 1. Star field
    this.starfield = StarFieldGenerator.createStarField(dna, rng.fork('starfield'));
    this.rootGroup.add(this.starfield.group);

    // 2. Nebula if density > 0.1
    if (dna.nebulaDensity > 0.1) {
      this.nebula = NebulaGenerator.createNebula(dna, rng.fork('nebula'));
      this.rootGroup.add(this.nebula.group);
    }

    // 3. Central feature: Black Hole if gravity > 2.8, otherwise Galaxy or Solar System
    const hasBlackHole = dna.gravityStrength > 2.8;
    if (hasBlackHole) {
      this.blackHole = BlackHoleGenerator.createBlackHole(dna, rng.fork('blackhole'));
      this.rootGroup.add(this.blackHole.group);
    } else if (dna.galaxyCount > 0 && dna.planetCount <= 4) {
      this.galaxy = GalaxyGenerator.createGalaxy(dna, rng.fork('galaxy'), {
        radius: dna.universeSize * 0.35,
        tiltX: 0.35
      });
      this.rootGroup.add(this.galaxy.group);
    } else {
      this.solarSystem = SolarSystemGenerator.createSolarSystem(dna, rng.fork('solar'));
      this.rootGroup.add(this.solarSystem.group);
    }

    // 4. Gravity Field and particles
    this.gravityField = new GravityField();
    this.gravityField.addSource({
      id: 'core_mass',
      position: new THREE.Vector3(0, 0, 0),
      mass: dna.gravityStrength * 80,
      radius: 3.0,
      falloff: 2.0
    });

    // Dynamic gravity particles
    this.dynamicParticleCount = Math.floor(600 * dna.particleDensity);
    this.dynamicPositions = new Float32Array(this.dynamicParticleCount * 3);
    this.dynamicVelocities = new Float32Array(this.dynamicParticleCount * 3);

    for (let i = 0; i < this.dynamicParticleCount; i++) {
      const idx = i * 3;
      const r = rng.range(12, dna.universeSize * 0.35);
      const angle = rng.next() * Math.PI * 2;
      this.dynamicPositions[idx] = Math.cos(angle) * r;
      this.dynamicPositions[idx + 1] = rng.gaussian(0, 2);
      this.dynamicPositions[idx + 2] = Math.sin(angle) * r;
    }

    this.gravityField.injectOrbitalVelocities(
      this.dynamicPositions,
      this.dynamicVelocities,
      this.dynamicParticleCount,
      0,
      dna.particleSpeed
    );

    this.dynamicParticlesGeo = new THREE.BufferGeometry();
    this.dynamicParticlesGeo.setAttribute('position', new THREE.BufferAttribute(this.dynamicPositions, 3));

    this.dynamicParticlesMat = new THREE.PointsMaterial({
      color: new THREE.Color(dna.nebulaColor.primary || '#00F0FF'),
      size: 2.5,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const dynPoints = new THREE.Points(this.dynamicParticlesGeo, this.dynamicParticlesMat);
    this.rootGroup.add(dynPoints);

    // Camera initial position
    if (this.camera) {
      this.camera.position.set(0, dna.cameraDepth * 0.6, dna.cameraDepth);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    const time = ctx.time * (this.currentDNA?.timeScale ?? 1.0);
    const delta = ctx.delta * (this.currentDNA?.timeScale ?? 1.0);

    if (this.eventManager) this.eventManager.update(delta);
    if (this.starfield) this.starfield.update(time, delta, ctx.input, ctx.motion);
    if (this.nebula) this.nebula.update(time, delta);
    if (this.galaxy) this.galaxy.update(time, delta);
    if (this.solarSystem) this.solarSystem.update(time, delta);
    if (this.blackHole) this.blackHole.update(time, delta);

    // Gravity field particles update
    if (
      this.gravityField &&
      this.dynamicPositions &&
      this.dynamicVelocities &&
      this.dynamicParticlesGeo
    ) {
      this.gravityField.updateParticles(
        this.dynamicPositions,
        this.dynamicVelocities,
        this.dynamicParticleCount,
        delta,
        this.currentDNA?.gravityStrength ?? 1.0
      );
      this.dynamicParticlesGeo.attributes.position.needsUpdate = true;
    }

    // Camera orbit and responsive framing
    if (this.camera && this.currentDNA) {
      const baseDepth = this.currentDNA.cameraDepth;
      const targetX = (ctx.input.x * baseDepth * 0.3) + (ctx.motion.isAvailable ? ctx.motion.tiltX * 15 : 0);
      const targetY = (baseDepth * 0.6) + (ctx.input.y * baseDepth * 0.2) + (ctx.motion.isAvailable ? ctx.motion.tiltY * 10 : 0);

      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
  }

  public setDNA(dna: WorldDNA): void {
    this.currentDNA = dna;
    if (this.scene && this.camera && this.quality) {
      this.init(this.scene, this.camera, this.quality);
    }
  }

  public triggerEvent(type: any): void {
    if (this.eventManager) {
      this.eventManager.trigger(type);
    }
  }

  public dispose(): void {
    if (this.eventManager) {
      this.eventManager.dispose();
      this.eventManager = null;
    }
    if (this.starfield) {
      this.starfield.dispose();
      this.starfield = null;
    }
    if (this.nebula) {
      this.nebula.dispose();
      this.nebula = null;
    }
    if (this.galaxy) {
      this.galaxy.dispose();
      this.galaxy = null;
    }
    if (this.solarSystem) {
      this.solarSystem.dispose();
      this.solarSystem = null;
    }
    if (this.blackHole) {
      this.blackHole.dispose();
      this.blackHole = null;
    }
    if (this.dynamicParticlesGeo) {
      this.dynamicParticlesGeo.dispose();
      this.dynamicParticlesGeo = null;
    }
    if (this.dynamicParticlesMat) {
      this.dynamicParticlesMat.dispose();
      this.dynamicParticlesMat = null;
    }
    this.dynamicPositions = null;
    this.dynamicVelocities = null;
    this.gravityField = null;
    super.dispose();
  }
}
