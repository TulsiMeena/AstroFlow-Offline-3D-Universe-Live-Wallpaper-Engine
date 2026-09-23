import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { EnvironmentEngine } from '../environment/EnvironmentEngine';
import { EnvironmentDNA, BiomeType } from '../environment/types/environmentDNA';
import { EnvironmentDNAFactory } from '../environment/EnvironmentDNA';
import { QualityConfig } from '../types/engine';
import { LivingWorldEngine } from '../living/LivingWorldEngine';
import { EcosystemDNA } from '../living/EcosystemDNA';

export class ProceduralEnvironmentWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata;
  private envEngine: EnvironmentEngine | null = null;
  private initialBiome: BiomeType;
  private customDNA?: EnvironmentDNA;
  private customEcoDNA?: EcosystemDNA;

  constructor(biome: BiomeType = 'living-forest', customDNA?: EnvironmentDNA, customEcoDNA?: EcosystemDNA) {
    super();
    this.initialBiome = biome;
    this.customDNA = customDNA;
    this.customEcoDNA = customEcoDNA;

    const name = customDNA ? customDNA.name : EnvironmentDNAFactory.formatName(biome);

    this.metadata = {
      id: customDNA ? customDNA.id : `env-wallpaper-${biome}`,
      title: name,
      subtitle: 'Procedural 3D Environment Engine',
      category: 'Nature',
      description: customDNA ? customDNA.description : `Fully procedural 3D ${name} with dynamic weather and atmospheric lighting.`,
      author: 'Amit Meena',
      tags: ['environment', 'procedural', biome, 'weather', '3d'],
      accentColor: customDNA ? customDNA.accentColor : '#00ffa3',
      secondaryColor: '#00f0ff',
      interactive: true,
      proceduralType: 'mesh'
    };
  }

  protected buildScene(): void {
    if (!this.scene || !this.camera || !this.quality) return;

    const dna = this.customDNA || EnvironmentDNAFactory.getPresetByBiome(this.initialBiome, 1337);

    // Save initial camera settings
    this.camera.fov = dna.camera.fov;
    this.camera.updateProjectionMatrix();

    this.envEngine = new EnvironmentEngine(this.scene, this.camera, this.quality, dna);
    if (this.customEcoDNA && this.envEngine.getLivingWorldEngine()) {
      this.envEngine.getLivingWorldEngine().setEcosystemDNA(this.customEcoDNA);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (!this.envEngine) return;
    this.envEngine.update(ctx.time, ctx.delta, ctx.input, ctx.motion);
  }

  public onQualityChange(quality: QualityConfig): void {
    super.onQualityChange(quality);
    if (this.envEngine) {
      this.envEngine.onQualityChange(quality);
    }
  }

  public onResize(width: number, height: number): void {
    super.onResize(width, height);
    if (this.envEngine) {
      this.envEngine.onResize(width, height);
    }
  }

  public getEnvironmentEngine(): EnvironmentEngine | null {
    return this.envEngine;
  }

  public getLivingWorldEngine(): LivingWorldEngine | null {
    return this.envEngine ? this.envEngine.getLivingWorldEngine() : null;
  }

  public dispose(): void {
    if (this.envEngine) {
      this.envEngine.dispose();
      this.envEngine = null;
    }
    super.dispose();
  }
}
