import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { UniverseSeedEngine } from '../universe/seed/UniverseSeedEngine';
import { StarFieldGenerator } from '../universe/generators/StarFieldGenerator';
import * as THREE from 'three';

export class DeepSpaceWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'deep-space',
    title: 'Deep Space',
    subtitle: 'Multi-Depth Parallax & Shooting Stars',
    category: 'Cosmic Universes',
    description: 'Immense cosmic expanse with 4 depth layers of parallax stars, astronomical spectral classification, touch-reactive cosmic dust, and shooting star streaks.',
    author: 'Amit Meena',
    tags: ['Deep Space', 'Stars', 'Parallax', 'Shooting Stars', 'Interactive'],
    accentColor: '#00D4FF',
    secondaryColor: '#B000FF',
    interactive: true,
    proceduralType: 'universe'
  };

  private starfieldInstance: {
    group: THREE.Group;
    update: (t: number, d: number, i?: any, m?: any) => void;
    triggerShootingStar: () => void;
    dispose: () => void;
  } | null = null;

  protected buildScene(): void {
    const dna = UniverseSeedEngine.createDNAFromSeed('DEEP-1100-BOUNDLESS');
    const rng = new SeededRNG(dna.seed);

    this.starfieldInstance = StarFieldGenerator.createStarField(dna, rng);
    this.rootGroup.add(this.starfieldInstance.group);

    if (this.camera) {
      this.camera.position.set(0, 0, 50);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (this.starfieldInstance) {
      this.starfieldInstance.update(ctx.time, ctx.delta, ctx.input, ctx.motion);
    }

    if (this.camera) {
      const targetX = (ctx.input.x * 14) + (ctx.motion.isAvailable ? ctx.motion.tiltX * 10 : 0);
      const targetY = (ctx.input.y * 10) + (ctx.motion.isAvailable ? ctx.motion.tiltY * 8 : 0);
      this.camera.position.x += (targetX - this.camera.position.x) * 0.04;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.04;
      this.camera.lookAt(0, 0, 0);
    }
  }

  public dispose(): void {
    if (this.starfieldInstance) {
      this.starfieldInstance.dispose();
      this.starfieldInstance = null;
    }
    super.dispose();
  }
}
