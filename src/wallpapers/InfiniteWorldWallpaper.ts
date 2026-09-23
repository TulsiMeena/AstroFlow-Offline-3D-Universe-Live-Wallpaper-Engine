import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { InfiniteWorldEngine } from '../infinite/InfiniteWorldEngine';
import { FusionDNA } from '../infinite/types/infiniteTypes';
import { FusionDNAFactory } from '../infinite/dna/FusionDNA';
import { QualityConfig } from '../types/engine';

export class InfiniteWorldWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata;
  private engine: InfiniteWorldEngine | null = null;
  private customDNA?: FusionDNA;

  constructor(customDNA?: FusionDNA) {
    super();
    this.customDNA = customDNA;
    const dna = customDNA || FusionDNAFactory.getCuratedPresets()[0];

    this.metadata = {
      id: customDNA ? `infinite-${customDNA.id}` : 'infinite-world-fusion',
      title: dna.name,
      subtitle: 'Infinite Procedural World & Fusion Engine',
      category: 'Cosmic Universes',
      description: dna.description,
      author: 'Amit Meena',
      tags: [...dna.tags, 'infinite-world', 'fusion', 'procedural-chunks'],
      accentColor: dna.accentColor,
      secondaryColor: dna.secondaryColor,
      interactive: true,
      proceduralType: 'universe'
    };
  }

  protected buildScene(): void {
    if (!this.scene || !this.camera || !this.quality) return;

    this.camera.fov = 60;
    this.camera.near = 0.1;
    this.camera.far = 1200;
    this.camera.updateProjectionMatrix();

    this.engine = new InfiniteWorldEngine(
      this.scene,
      this.camera,
      this.quality,
      this.customDNA
    );
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (!this.engine) return;
    this.engine.update(ctx.time, ctx.delta, ctx.input, ctx.motion);
  }

  public onQualityChange(quality: QualityConfig): void {
    super.onQualityChange(quality);
    if (this.engine) {
      this.engine.onQualityChange(quality);
    }
  }

  public getEngine(): InfiniteWorldEngine | null {
    return this.engine;
  }

  public dispose(): void {
    if (this.engine) {
      this.engine.dispose();
      this.engine = null;
    }
    super.dispose();
  }
}
