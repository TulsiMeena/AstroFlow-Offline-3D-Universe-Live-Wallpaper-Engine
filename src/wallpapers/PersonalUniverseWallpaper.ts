import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext, IWallpaper } from '../types/wallpaper';
import { PersonalWorld } from '../personal/types';
import { ProceduralUniverseWallpaper } from './ProceduralUniverseWallpaper';
import { ProceduralEnvironmentWallpaper } from './ProceduralEnvironmentWallpaper';
import { InfiniteWorldWallpaper } from './InfiniteWorldWallpaper';
import { WallpaperFusionEngine } from '../designer/engine/WallpaperFusionEngine';
import { QualityConfig } from '../types/engine';

export class PersonalUniverseWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata;
  public readonly world: PersonalWorld;
  private delegate: IWallpaper | null = null;

  constructor(world: PersonalWorld) {
    super();
    this.world = world;

    const categoryMap: Record<string, any> = {
      'SPACE': 'Cosmic Universes',
      'OCEAN': 'Nature',
      'FOREST': 'Nature',
      'MOUNTAIN': 'Nature',
      'NATURE': 'Nature',
      'VOLCANO': 'Energy',
      'CYBER CITY': 'Cyberpunk',
      'CRYSTAL': 'Abstract',
      'ENERGY': 'Energy',
      'FANTASY': 'Abstract',
      'ABSTRACT': 'Abstract',
      'MIXED': 'Cosmic Universes',
      'RANDOM': 'Cosmic Universes'
    };

    this.metadata = {
      id: `personal-universe-${world.id}`,
      title: world.name,
      subtitle: `Procedural ${world.recipe.worldType} • ${world.recipe.style}`,
      category: categoryMap[world.recipe.worldType] || 'Cosmic Universes',
      description: world.recipe.customPrompt
        ? `"${world.recipe.customPrompt}" — Deterministic Seed: ${world.seed}`
        : `Procedural 3D World in ${world.recipe.style} style with ${world.recipe.atmosphere} atmosphere. Seed: ${world.seed}`,
      author: 'Amit Meena',
      tags: [
        'personal-universe',
        world.recipe.worldType.toLowerCase(),
        world.recipe.style.toLowerCase(),
        world.recipe.atmosphere.toLowerCase(),
        world.seed
      ],
      accentColor: world.recipe.colors.primary,
      secondaryColor: world.recipe.colors.secondary,
      interactive: true,
      proceduralType: world.recipe.worldType === 'SPACE' ? 'universe' : 'mesh'
    };

    // Instantiate appropriate delegate renderer
    this.initDelegate();
  }

  private initDelegate(): void {
    const wt = this.world.recipe.worldType;

    if (wt === 'SPACE') {
      this.delegate = new ProceduralUniverseWallpaper(this.world.worldDNA);
    } else if (wt === 'NATURE' || wt === 'FOREST' || wt === 'OCEAN' || wt === 'MOUNTAIN' || wt === 'VOLCANO') {
      this.delegate = new ProceduralEnvironmentWallpaper(
        this.world.environmentDNA.biome,
        this.world.environmentDNA,
        this.world.ecosystemDNA
      );
    } else if (wt === 'MIXED') {
      this.delegate = new InfiniteWorldWallpaper(this.world.fusionDNA);
    } else {
      // CYBER CITY, CRYSTAL, ENERGY, FANTASY, ABSTRACT
      this.delegate = new WallpaperFusionEngine(this.world.designDNA);
    }
  }

  public init(scene: THREE.Scene, camera: THREE.PerspectiveCamera, quality: QualityConfig): void {
    this.scene = scene;
    this.camera = camera;
    this.quality = quality;
    if (this.delegate) {
      this.delegate.init(scene, camera, quality);
    }
  }

  protected buildScene(): void {
    // Delegated
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (this.delegate) {
      this.delegate.update(ctx);
    }
  }

  public onQualityChange(quality: QualityConfig): void {
    super.onQualityChange(quality);
    if (this.delegate) {
      this.delegate.onQualityChange(quality);
    }
  }

  public onResize(width: number, height: number): void {
    super.onResize(width, height);
    if (this.delegate) {
      this.delegate.onResize(width, height);
    }
  }

  public dispose(): void {
    if (this.delegate) {
      this.delegate.dispose();
      this.delegate = null;
    }
    super.dispose();
  }
}
