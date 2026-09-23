import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { UniverseSeedEngine } from '../universe/seed/UniverseSeedEngine';
import { NebulaGenerator } from '../universe/generators/NebulaGenerator';
import { StarFieldGenerator } from '../universe/generators/StarFieldGenerator';

export class ProceduralNebulaWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'procedural-nebula',
    title: 'Nebula',
    subtitle: 'Volumetric Fractional Brownian Gas',
    category: 'Cosmic Universes',
    description: 'Vibrant interstellar nursery generated entirely through mathematical procedural noise with dynamic turbulence, color diffusion, and stellar illumination.',
    author: 'Amit Meena',
    tags: ['Nebula', 'Shader', 'Procedural', 'Volumetric', 'Colors'],
    accentColor: '#FF3366',
    secondaryColor: '#9D00FF',
    interactive: true,
    proceduralType: 'shader'
  };

  private nebulaInstance: {
    group: THREE.Group;
    update: (t: number, d: number) => void;
    pulseGlow: (s: number) => void;
    dispose: () => void;
  } | null = null;

  private starfieldInstance: { group: THREE.Group; update: (t: number, d: number, i?: any, m?: any) => void; dispose: () => void } | null = null;

  protected buildScene(): void {
    const dna = UniverseSeedEngine.createDNAFromSeed('ORION-5500-NURSERY');
    const rng = new SeededRNG(dna.seed);

    this.starfieldInstance = StarFieldGenerator.createStarField(dna, rng.fork('stars'));
    this.rootGroup.add(this.starfieldInstance.group);

    this.nebulaInstance = NebulaGenerator.createNebula(dna, rng.fork('nebula'));
    this.rootGroup.add(this.nebulaInstance.group);

    if (this.camera) {
      this.camera.position.set(0, 0, 45);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (this.nebulaInstance) {
      this.nebulaInstance.update(ctx.time, ctx.delta);
      if (ctx.input.isDown) {
        this.nebulaInstance.pulseGlow(0.6);
      }
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.update(ctx.time, ctx.delta, ctx.input, ctx.motion);
    }

    if (this.camera) {
      const targetX = (ctx.input.x * 12) + (ctx.motion.isAvailable ? ctx.motion.tiltX * 8 : 0);
      const targetY = (ctx.input.y * 10) + (ctx.motion.isAvailable ? ctx.motion.tiltY * 6 : 0);
      this.camera.position.x += (targetX - this.camera.position.x) * 0.04;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.04;
      this.camera.lookAt(0, 0, 0);
    }
  }

  public dispose(): void {
    if (this.nebulaInstance) {
      this.nebulaInstance.dispose();
      this.nebulaInstance = null;
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.dispose();
      this.starfieldInstance = null;
    }
    super.dispose();
  }
}
