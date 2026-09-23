import { IWallpaper, WallpaperMetadata } from '../types/wallpaper';
import { CosmicParticleFieldWallpaper } from '../wallpapers/CosmicParticleField';
import { GalaxyCoreWallpaper } from '../wallpapers/GalaxyCore';
import { NeonEnergySphereWallpaper } from '../wallpapers/NeonEnergySphere';
import { LiquidRippleWallpaper } from '../wallpapers/LiquidRipple';
import { AuroraSkyWallpaper } from '../wallpapers/AuroraSky';
import { CyberGridWallpaper } from '../wallpapers/CyberGrid';
import { GalaxyGeneratorWallpaper } from '../wallpapers/GalaxyGeneratorWallpaper';
import { PlanetarySystemWallpaper } from '../wallpapers/PlanetarySystemWallpaper';
import { BlackHoleWallpaper } from '../wallpapers/BlackHoleWallpaper';
import { DeepSpaceWallpaper } from '../wallpapers/DeepSpaceWallpaper';
import { ProceduralNebulaWallpaper } from '../wallpapers/ProceduralNebulaWallpaper';
import { InfiniteUniverseWallpaper } from '../wallpapers/InfiniteUniverseWallpaper';
import { ProceduralUniverseWallpaper } from '../wallpapers/ProceduralUniverseWallpaper';
import { ProceduralEnvironmentWallpaper } from '../wallpapers/ProceduralEnvironmentWallpaper';
import { InfiniteWorldWallpaper } from '../wallpapers/InfiniteWorldWallpaper';
import { WallpaperFusionEngine } from '../designer/engine/WallpaperFusionEngine';

export type WallpaperFactory = () => IWallpaper;

export class WallpaperRegistry {
  private static instance: WallpaperRegistry;
  private factories: Map<string, WallpaperFactory> = new Map();
  private metadataList: WallpaperMetadata[] = [];

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): WallpaperRegistry {
    if (!WallpaperRegistry.instance) {
      WallpaperRegistry.instance = new WallpaperRegistry();
    }
    return WallpaperRegistry.instance;
  }

  private registerDefaults() {
    // Original 6 Core Wallpapers (preserved 100%)
    this.register('cosmic-particle-field', () => new CosmicParticleFieldWallpaper());
    this.register('galaxy-core', () => new GalaxyCoreWallpaper());
    this.register('neon-energy-sphere', () => new NeonEnergySphereWallpaper());
    this.register('liquid-ripple', () => new LiquidRippleWallpaper());
    this.register('aurora-sky', () => new AuroraSkyWallpaper());
    this.register('cyber-grid', () => new CyberGridWallpaper());

    // Module 2: Procedural Universe Generation Engine Wallpapers
    this.register('galaxy-generator', () => new GalaxyGeneratorWallpaper());
    this.register('planetary-system', () => new PlanetarySystemWallpaper());
    this.register('black-hole', () => new BlackHoleWallpaper());
    this.register('deep-space', () => new DeepSpaceWallpaper());
    this.register('procedural-nebula', () => new ProceduralNebulaWallpaper());
    this.register('infinite-universe', () => new InfiniteUniverseWallpaper());
    this.register('procedural-universe', () => new ProceduralUniverseWallpaper());

    // Module 3: Procedural 3D Environment Engine Wallpapers
    this.register('env-living-forest', () => new ProceduralEnvironmentWallpaper('living-forest'));
    this.register('env-ocean-world', () => new ProceduralEnvironmentWallpaper('ocean-world'));
    this.register('env-cyber-city', () => new ProceduralEnvironmentWallpaper('cyber-city'));
    this.register('env-volcano-world', () => new ProceduralEnvironmentWallpaper('volcano-world'));
    this.register('env-crystal-world', () => new ProceduralEnvironmentWallpaper('crystal-world'));
    this.register('env-thunder-storm', () => new ProceduralEnvironmentWallpaper('thunder-storm'));
    this.register('env-snow-world', () => new ProceduralEnvironmentWallpaper('snow-world'));
    this.register('env-floating-islands', () => new ProceduralEnvironmentWallpaper('floating-islands'));

    // Module 4: Infinite World + World Fusion Engine
    this.register('infinite-world-fusion', () => new InfiniteWorldWallpaper());

    // Module 5: Wallpaper Fusion Lab & Procedural Designer
    this.register('procedural-designer', () => new WallpaperFusionEngine());
  }

  public register(id: string, factory: WallpaperFactory) {
    this.factories.set(id, factory);
    const instance = factory();
    const existingIdx = this.metadataList.findIndex(m => m.id === id);
    if (existingIdx >= 0) {
      this.metadataList[existingIdx] = instance.metadata;
    } else {
      this.metadataList.push(instance.metadata);
    }
    instance.dispose();
  }

  public createWallpaper(id: string): IWallpaper | null {
    const factory = this.factories.get(id);
    if (!factory) {
      console.warn(`Wallpaper factory not found for id: ${id}`);
      return null;
    }
    return factory();
  }

  public getAllMetadata(): WallpaperMetadata[] {
    return [...this.metadataList];
  }

  public getMetadataById(id: string): WallpaperMetadata | undefined {
    return this.metadataList.find(m => m.id === id);
  }

  public getByCategory(category: string): WallpaperMetadata[] {
    if (!category || category === 'All') return this.getAllMetadata();
    return this.metadataList.filter(m => m.category.toLowerCase() === category.toLowerCase());
  }
}
