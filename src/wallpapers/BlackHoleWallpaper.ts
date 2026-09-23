import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { BlackHoleGenerator } from '../universe/generators/BlackHoleGenerator';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { UniverseSeedEngine } from '../universe/seed/UniverseSeedEngine';
import { StarFieldGenerator } from '../universe/generators/StarFieldGenerator';

export class BlackHoleWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'black-hole',
    title: 'Black Hole',
    subtitle: 'Singularity & Relativistic Accretion',
    category: 'Cosmic Universes',
    description: 'Relativistic gravitational singularity showcasing a light-absorbing event horizon, swirling Doppler-shifted accretion disk, and Einstein lensing rings.',
    author: 'Amit Meena',
    tags: ['Black Hole', 'Singularity', 'Accretion Disk', 'Einstein Ring', 'Relativity'],
    accentColor: '#FF6B00',
    secondaryColor: '#990000',
    interactive: true,
    proceduralType: 'black-hole'
  };

  private blackHoleInstance: { group: THREE.Group; update: (t: number, d: number) => void; dispose: () => void } | null = null;
  private starfieldInstance: { group: THREE.Group; update: (t: number, d: number, i?: any, m?: any) => void; dispose: () => void } | null = null;

  protected buildScene(): void {
    const dna = UniverseSeedEngine.createDNAFromSeed('VOID-9000-SINGULARITY');
    const rng = new SeededRNG(dna.seed);

    this.starfieldInstance = StarFieldGenerator.createStarField(dna, rng.fork('stars'));
    this.rootGroup.add(this.starfieldInstance.group);

    this.blackHoleInstance = BlackHoleGenerator.createBlackHole(dna, rng.fork('singularity'));
    this.rootGroup.add(this.blackHoleInstance.group);

    if (this.camera) {
      this.camera.position.set(0, 14, 38);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (this.blackHoleInstance) {
      this.blackHoleInstance.update(ctx.time, ctx.delta);
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.update(ctx.time, ctx.delta, ctx.input, ctx.motion);
    }

    if (this.camera) {
      const targetX = (ctx.input.x * 10) + (ctx.motion.isAvailable ? ctx.motion.tiltX * 6 : 0);
      const targetY = 14 + (ctx.input.y * 8) + (ctx.motion.isAvailable ? ctx.motion.tiltY * 5 : 0);
      this.camera.position.x += (targetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetY - this.camera.position.y) * 0.05;
      this.camera.lookAt(0, 0, 0);
    }
  }

  public dispose(): void {
    if (this.blackHoleInstance) {
      this.blackHoleInstance.dispose();
      this.blackHoleInstance = null;
    }
    if (this.starfieldInstance) {
      this.starfieldInstance.dispose();
      this.starfieldInstance = null;
    }
    super.dispose();
  }
}
