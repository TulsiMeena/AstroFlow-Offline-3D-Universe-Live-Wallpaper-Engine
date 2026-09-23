import { WallpaperRegistry } from '../engine/WallpaperRegistry';
import { WallpaperStorage } from '../storage/wallpaperStorage';
import { PersonalPresetManager } from '../personal/PersonalPresetManager';
import { CustomWallpaperManager } from '../designer/storage/CustomWallpaperManager';
import { FusionStorage } from '../infinite/storage/FusionStorage';
import { WallpaperMetadataManager } from './WallpaperMetadataManager';
import {
  LibraryWallpaperItem,
  LibraryCategory,
  BatteryImpactLevel,
  PerformanceLevel,
  MotionSupportLevel
} from './types';

export class WallpaperCatalog {
  private static cachedCatalog: LibraryWallpaperItem[] | null = null;
  private static lastCatalogBuildTime: number = 0;

  /**
   * Builds or returns cached unified wallpaper catalog
   */
  public static getCatalog(forceRefresh: boolean = false): LibraryWallpaperItem[] {
    const now = Date.now();
    // Cache for 1000ms unless forced
    if (!forceRefresh && this.cachedCatalog && now - this.lastCatalogBuildTime < 1000) {
      return [...this.cachedCatalog];
    }

    const items: LibraryWallpaperItem[] = [];
    const favorites = new Set(WallpaperStorage.getPreferences().favorites);
    const stats = WallpaperMetadataManager.getAllStats();

    // 1. Built-in Core & Extended Wallpapers from WallpaperRegistry
    const registry = WallpaperRegistry.getInstance();
    const builtins = registry.getAllMetadata();

    for (const b of builtins) {
      const isFav = favorites.has(b.id);
      const stat = stats[b.id];
      const category = this.mapBuiltinToLibraryCategory(b);
      const batteryImpact = this.inferBuiltinBatteryImpact(b);
      const performance = this.inferBuiltinPerformance(b);

      items.push({
        id: b.id,
        name: b.title,
        subtitle: b.subtitle || 'Procedural WebGL Engine',
        description: b.description || 'Deterministic interactive 3D wallpaper.',
        category,
        source: 'built-in',
        seed: `seed-${b.id}`,
        numericSeed: this.hashString(b.id),
        environment: b.category,
        style: b.proceduralType,
        weather: b.category === 'Nature' ? 'Breeze' : 'Clear Space',
        tags: [...(b.tags || []), b.category, b.proceduralType, 'procedural', 'offline'],
        accentColor: b.accentColor || '#00F0FF',
        secondaryColor: b.secondaryColor || '#7000FF',
        motionSupport: 'DYNAMIC',
        interactiveSupport: b.interactive !== false,
        audioReactive: b.id.includes('energy') || b.id.includes('ripple') || b.id.includes('cyber'),
        physicsSupport: true,
        livingWorld: b.id.startsWith('env-') || b.id.includes('nature') || b.id.includes('ocean'),
        batteryImpact,
        performance,
        author: b.author || 'Amit HyperWall',
        createdAt: 1710000000000,
        lastOpenedAt: stat?.lastOpenedAt,
        viewCount: stat?.viewCount || 0,
        isFavorite: isFav,
        builtinMetadata: b
      });
    }

    // 2. Personal Universe Worlds (Created with Personal Universe Generator)
    const personalWorlds = PersonalPresetManager.getAllWorlds();
    for (const pw of personalWorlds) {
      const isFav = favorites.has(pw.id) || favorites.has(`personal-${pw.id}`);
      const stat = stats[pw.id] || stats[`personal-${pw.id}`];
      const category = this.mapPersonalToCategory(pw.recipe.worldType);

      items.push({
        id: `personal-${pw.id}`,
        name: pw.name,
        subtitle: `Custom ${pw.recipe.worldType} Universe`,
        description: pw.recipe.customPrompt || `Procedural personal world in ${pw.recipe.style} style with ${pw.recipe.atmosphere} atmosphere.`,
        category,
        source: 'personal',
        seed: pw.seed,
        numericSeed: pw.recipe.numericSeed,
        environment: pw.recipe.worldType,
        style: pw.recipe.style,
        weather: pw.recipe.weather?.type || pw.recipe.atmosphere,
        tags: [
          pw.recipe.worldType,
          pw.recipe.style,
          pw.recipe.atmosphere,
          'personal-world',
          'custom-creation',
          'deterministic'
        ],
        accentColor: pw.recipe.lighting?.sunColor || '#00F0FF',
        secondaryColor: pw.recipe.lighting?.emissiveColor || '#7000FF',
        motionSupport: (pw.recipe.motion as MotionSupportLevel) || 'BALANCED',
        interactiveSupport: true,
        audioReactive: true,
        physicsSupport: true,
        livingWorld: pw.recipe.worldType === 'NATURE' || pw.recipe.worldType === 'OCEAN' || pw.recipe.worldType === 'FOREST',
        batteryImpact: pw.recipe.performance === 'BATTERY SAVER' ? 'LOW' : pw.recipe.performance === 'HIGH QUALITY' ? 'HIGH' : 'MEDIUM',
        performance: (pw.recipe.performance as PerformanceLevel) || 'BALANCED',
        author: 'Created By You',
        createdAt: pw.createdAt || Date.now(),
        lastOpenedAt: stat?.lastOpenedAt,
        viewCount: stat?.viewCount || 0,
        isFavorite: isFav,
        personalWorld: pw
      });
    }

    // 3. Saved Custom Designs (from Wallpaper Fusion Lab)
    const customDesigns = CustomWallpaperManager.getSavedWallpapers();
    for (const cd of customDesigns) {
      const isFav = favorites.has(cd.id) || favorites.has(`custom-design-${cd.seed}`);
      const stat = stats[cd.id];

      items.push({
        id: `custom-design-${cd.seed}`,
        name: cd.name,
        subtitle: `Fused: ${cd.previewMetadata.elementsSummary || 'Multi-Element'}`,
        description: `Procedural fusion with ${cd.dna.elements.join(', ')}.`,
        category: 'MIXED WORLDS',
        source: 'fusion',
        seed: cd.seed,
        numericSeed: this.hashString(cd.seed),
        environment: cd.dna.elements[0] || 'Fusion',
        style: cd.dna.material.type || 'Holographic',
        weather: cd.dna.layers.Atmosphere?.enabled ? 'Atmospheric Glow' : 'Clear',
        tags: [...cd.dna.elements, 'fusion-lab', 'custom-design', 'composite'],
        accentColor: cd.dna.colors.primary || '#FF007F',
        secondaryColor: cd.dna.colors.secondary || '#00F0FF',
        motionSupport: cd.dna.motion?.mode === 'Dynamic' ? 'DYNAMIC' : cd.dna.motion?.mode === 'Subtle' ? 'SUBTLE' : 'BALANCED',
        interactiveSupport: true,
        audioReactive: cd.dna.audio?.enabled ?? true,
        physicsSupport: true,
        livingWorld: cd.dna.elements.some(e => e.includes('Forest') || e.includes('Ocean')),
        batteryImpact: 'MEDIUM',
        performance: 'BALANCED',
        author: 'Created By You',
        createdAt: cd.createdAt || Date.now(),
        lastOpenedAt: stat?.lastOpenedAt,
        viewCount: stat?.viewCount || 0,
        isFavorite: isFav,
        designDNA: cd.dna
      });
    }

    // 4. Saved Fused Worlds (from Infinite World Engine)
    const fusedWorlds = FusionStorage.getAllSavedWorlds();
    for (const fw of fusedWorlds) {
      const id = `fused-${fw.id}`;
      // Skip if already in list
      if (items.some(i => i.id === id)) continue;

      const isFav = favorites.has(id);
      const stat = stats[id];
      const fwSeed = `seed-${fw.baseWorldSeed}-${fw.id}`;

      items.push({
        id,
        name: fw.name,
        subtitle: `Bi-System: ${fw.primarySystem} + ${fw.secondarySystem}`,
        description: fw.description || `Infinite procedural cross-fused world with interactive portal physics.`,
        category: 'MIXED WORLDS',
        source: 'infinite',
        seed: fwSeed,
        numericSeed: fw.baseWorldSeed || this.hashString(id),
        environment: `${fw.primarySystem} & ${fw.secondarySystem}`,
        style: `${fw.primaryBiome} / ${fw.secondaryBiome}`,
        weather: fw.weatherType,
        tags: [fw.primarySystem, fw.secondarySystem, fw.weatherType, 'infinite-world', 'portal'],
        accentColor: fw.accentColor || fw.primaryColor || '#00FFA3',
        secondaryColor: fw.secondaryColor || '#7000FF',
        motionSupport: 'DYNAMIC',
        interactiveSupport: true,
        audioReactive: true,
        physicsSupport: true,
        livingWorld: true,
        batteryImpact: 'HIGH',
        performance: 'HIGH QUALITY',
        author: 'Amit HyperWall',
        createdAt: fw.createdAt || Date.now(),
        lastOpenedAt: stat?.lastOpenedAt,
        viewCount: stat?.viewCount || 0,
        isFavorite: isFav,
        fusionDNA: fw
      });
    }

    this.cachedCatalog = items;
    this.lastCatalogBuildTime = now;
    return [...items];
  }

  public static getItemById(id: string): LibraryWallpaperItem | null {
    const catalog = this.getCatalog();
    return catalog.find(item => item.id === id) || null;
  }

  private static mapBuiltinToLibraryCategory(b: any): LibraryCategory {
    const id = b.id.toLowerCase();
    const cat = (b.category || '').toLowerCase();

    if (id.includes('thunder') || id.includes('aurora') || id.includes('snow') || id.includes('rain')) return 'WEATHER';
    if (id.includes('forest') || id.includes('ocean') || cat.includes('nature')) return 'NATURE';
    if (id.includes('volcano') || id.includes('crystal') || id.includes('liquid') || id.includes('ripple')) return 'ELEMENTS';
    if (id.includes('cyber') || id.includes('neon') || cat.includes('cyberpunk')) return 'FUTURISTIC';
    if (id.includes('island') || id.includes('fantasy')) return 'FANTASY';
    if (id.includes('grid') || id.includes('abstract') || cat.includes('abstract')) return 'ABSTRACT';
    if (id.includes('living') || id.includes('env-')) return 'LIVING WORLDS';
    if (id.includes('fusion') || id.includes('infinite')) return 'MIXED WORLDS';
    if (id.includes('cosmic') || id.includes('galaxy') || id.includes('universe') || id.includes('nebula') || id.includes('space') || id.includes('hole')) return 'COSMIC';
    return 'COSMIC';
  }

  private static mapPersonalToCategory(worldType: string): LibraryCategory {
    switch (worldType) {
      case 'SPACE':
        return 'COSMIC';
      case 'NATURE':
      case 'FOREST':
        return 'NATURE';
      case 'OCEAN':
      case 'VOLCANO':
      case 'CRYSTAL':
        return 'ELEMENTS';
      case 'CYBER_CITY':
        return 'FUTURISTIC';
      case 'MOUNTAIN':
      case 'DESERT':
        return 'LIVING WORLDS';
      case 'VOID':
      case 'ABSTRACT':
      default:
        return 'ABSTRACT';
    }
  }

  private static inferBuiltinBatteryImpact(b: any): BatteryImpactLevel {
    const id = b.id.toLowerCase();
    if (id.includes('cyber-grid') || id.includes('aurora-sky')) return 'LOW';
    if (id.includes('black-hole') || id.includes('procedural-universe') || id.includes('env-living-forest')) return 'HIGH';
    return 'MEDIUM';
  }

  private static inferBuiltinPerformance(b: any): PerformanceLevel {
    const impact = this.inferBuiltinBatteryImpact(b);
    if (impact === 'LOW') return 'BATTERY SAVER';
    if (impact === 'HIGH') return 'HIGH QUALITY';
    return 'BALANCED';
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
