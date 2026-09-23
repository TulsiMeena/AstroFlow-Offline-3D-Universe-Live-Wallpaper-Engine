import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { SolarSystemGenerator } from '../universe/generators/SolarSystemGenerator';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { UniverseSeedEngine } from '../universe/seed/UniverseSeedEngine';
import { StarFieldGenerator } from '../universe/generators/StarFieldGenerator';

export class PlanetarySystemWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'planetary-system',
    title: 'Planetary System',
    subtitle: 'Keplerian Orbits & Instanced Asteroids',
    category: 'Cosmic Universes',
    description: 'Dynamic planetary system driven by Keplerian mechanics, featuring a pulsing central star, diverse procedural planets, orbiting moons, and an asteroid belt.',
    author: 'Amit Meena',
    tags: ['Solar System', 'Planets', 'Moons', 'Asteroids', 'Kepler'],
    accentColor: '#FFB800',
    secondaryColor: '#0284C7',
    interactive: true,
    proceduralType: 'system'
  };

  private systemInstance: {
    group: THREE.Group;
    update: (t: number, d: number) => void;
    pulseSunFlare: () => void;
    dispose: () => void;
  } | null = null;

  private starfieldInstance: { group: THREE.Group; update: (t: number, d: number, i?: any, m?: any) => void; dispose: () => void } | null = null;

  protected buildScene(): void {
    const dna = UniverseSeedEngine.createDNAFromSeed('SOLAR-4200-DOMINION');
    const rng = new SeededRNG(dna.seed);

    this.starfieldInstance = StarFieldGenerator.createStarField(dna, rng.fork('stars'));
    this.rootGroup.add(this.starfieldInstance.group);

    this.systemInstance = SolarSystemGenerator.createSolarSystem(dna, rng.fork('solar'));
    this.rootGroup.add(this.systemInstance.group);

    if (this.camera) {
      this.camera.position.set(0, 48, 85);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (this.systemInstance) {
      this.systemInstance.update(ctx.time, ctx.delta);
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.update(ctx.time, ctx.delta, ctx.input, ctx.motion);
    }

    // Camera orbit and tilt responsiveness
    if (this.camera) {
      const targetX = (ctx.input.x * 20) + (ctx.motion.isAvailable ? ctx.motion.tiltX * 12 : 0);
      const targetY = 48 + (ctx.input.y * 14) + (ctx.motion.isAvailable ? ctx.motion.tiltY * 8 : 0);
      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
  }

  public dispose(): void {
    if (this.systemInstance) {
      this.systemInstance.dispose();
      this.systemInstance = null;
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.dispose();
      this.starfieldInstance = null;
    }
    super.dispose();
  }
}
