import { DesignDNA, SavedCustomWallpaper } from '../types/designDNA';

const STORAGE_KEY = 'amit_hyperwall_custom_designs_v1';

export class CustomWallpaperManager {
  private static cachedDesigns: SavedCustomWallpaper[] | null = null;

  public static getSavedWallpapers(): SavedCustomWallpaper[] {
    if (this.cachedDesigns) {
      return [...this.cachedDesigns];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.cachedDesigns = JSON.parse(raw);
        return [...(this.cachedDesigns || [])];
      }
    } catch (e) {
      console.warn('Failed to load custom wallpapers from localStorage:', e);
    }

    this.cachedDesigns = [];
    return [];
  }

  public static saveWallpaper(name: string, dna: DesignDNA): SavedCustomWallpaper {
    const list = this.getSavedWallpapers();
    const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const savedItem: SavedCustomWallpaper = {
      id,
      name: name.trim() || dna.name || 'Untitled Custom Fusion',
      seed: dna.seed,
      dna: JSON.parse(JSON.stringify(dna)),
      createdAt: Date.now(),
      previewMetadata: {
        elementsSummary: dna.elements.join(' + '),
        dominantColor: dna.colors.primary,
        materialType: dna.material.type,
      },
      isFavorite: false,
    };

    list.unshift(savedItem);
    this.cachedDesigns = list;
    this.persist(list);
    return savedItem;
  }

  public static updateWallpaper(id: string, updates: Partial<SavedCustomWallpaper>): boolean {
    const list = this.getSavedWallpapers();
    const idx = list.findIndex(item => item.id === id);
    if (idx === -1) return false;

    list[idx] = { ...list[idx], ...updates };
    this.cachedDesigns = list;
    this.persist(list);
    return true;
  }

  public static deleteWallpaper(id: string): boolean {
    let list = this.getSavedWallpapers();
    const prevLen = list.length;
    list = list.filter(item => item.id !== id);
    if (list.length === prevLen) return false;

    this.cachedDesigns = list;
    this.persist(list);
    return true;
  }

  public static toggleFavorite(id: string): boolean {
    const list = this.getSavedWallpapers();
    const item = list.find(w => w.id === id);
    if (!item) return false;

    item.isFavorite = !item.isFavorite;
    this.cachedDesigns = list;
    this.persist(list);
    return item.isFavorite;
  }

  public static exportDesignJSON(dna: DesignDNA): string {
    return JSON.stringify(dna, null, 2);
  }

  public static importDesignJSON(jsonStr: string): DesignDNA | null {
    try {
      const parsed = JSON.parse(jsonStr) as DesignDNA;
      if (!parsed.seed || !parsed.elements || !parsed.layers) {
        throw new Error('Invalid DesignDNA structure');
      }
      return parsed;
    } catch (e) {
      console.error('Failed to import DesignDNA JSON:', e);
      return null;
    }
  }

  private static persist(list: SavedCustomWallpaper[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist custom wallpapers to localStorage:', e);
    }
  }
}
