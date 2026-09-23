import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { GalaxyGenerator } from '../universe/generators/GalaxyGenerator';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { UniverseSeedEngine } from '../universe/seed/UniverseSeedEngine';
import { StarFieldGenerator } from '../universe/generators/StarFieldGenerator';

export class GalaxyGeneratorWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'galaxy-generator',
    title: 'Galaxy Generator',
    subtitle: 'Procedural Spiral & Barred Star Systems',
    category: 'Cosmic Universes',
    description: 'Breathtaking offline procedural spiral galaxy featuring thousands of stellar particles, central core dynamics, and spectral star fields.',
    author: 'Amit Meena',
    tags: ['Galaxy', 'Stars', 'Procedural', '3D', 'Offline'],
    accentColor: '#00F0FF',
    secondaryColor: '#7000FF',
    interactive: true,
    proceduralType: 'galaxy'
  };

  private galaxyInstance: { group: THREE.Group; update: (t: number, d: number) => void; dispose: () => void } | null = null;
  private starfieldInstance: { group: THREE.Group; update: (t: number, d: number, i?: any, m?: any) => void; dispose: () => void } | null = null;

  protected buildScene(): void {
    const dna = UniverseSeedEngine.createDNAFromSeed('ANDROMEDA-7700-SPIRAL');
    const rng = new SeededRNG(dna.seed);

    this.starfieldInstance = StarFieldGenerator.createStarField(dna, rng.fork('starfield'));
    this.rootGroup.add(this.starfieldInstance.group);

    this.galaxyInstance = GalaxyGenerator.createGalaxy(dna, rng.fork('galaxy'), {
      radius: 45,
      tiltX: 0.45
    });
    this.rootGroup.add(this.galaxyInstance.group);

    if (this.camera) {
      this.camera.position.set(0, 32, 60);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (this.galaxyInstance) {
      this.galaxyInstance.update(ctx.time, ctx.delta);
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.update(ctx.time, ctx.delta, ctx.input, ctx.motion);
    }

    // Interactive camera responsiveness
    if (this.camera) {
      const targetX = (ctx.input.x * 12) + (ctx.motion.isAvailable ? ctx.motion.tiltX * 8 : 0);
      const targetY = 32 + (ctx.input.y * 8) + (ctx.motion.isAvailable ? ctx.motion.tiltY * 6 : 0);
      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
  }

  public dispose(): void {
    if (this.galaxyInstance) {
      this.galaxyInstance.dispose();
      this.galaxyInstance = null;
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.dispose();
      this.starfieldInstance = null;
    }
    super.dispose();
  }
}
