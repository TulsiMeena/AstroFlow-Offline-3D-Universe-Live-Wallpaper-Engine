import { FusionDNA } from '../types/infiniteTypes';
import { FusionDNAFactory } from '../dna/FusionDNA';

const STORAGE_KEY = 'amit_hyperwall_fused_worlds_v1';
const FAVORITES_KEY = 'amit_hyperwall_fused_favs_v1';

export class FusionStorage {
  private static cachedWorlds: FusionDNA[] | null = null;
  private static cachedFavorites: string[] | null = null;

  public static getAllSavedWorlds(): FusionDNA[] {
    if (this.cachedWorlds) return [...this.cachedWorlds];

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedWorlds = parsed;
          return [...parsed];
        }
      }
    } catch (e) {
      console.warn('Failed to read fused worlds from localStorage:', e);
    }

    // Seed with curated presets
    const defaults = FusionDNAFactory.getCuratedPresets();
    this.cachedWorlds = [...defaults];
    this.saveAllWorlds(defaults);
    return [...defaults];
  }

  public static saveWorld(dna: FusionDNA): void {
    const worlds = this.getAllSavedWorlds();
    const existingIdx = worlds.findIndex((w) => w.id === dna.id);
    if (existingIdx >= 0) {
      worlds[existingIdx] = dna;
    } else {
      worlds.unshift(dna);
    }
    this.saveAllWorlds(worlds);
  }

  public static deleteWorld(id: string): void {
    const worlds = this.getAllSavedWorlds().filter((w) => w.id !== id);
    this.saveAllWorlds(worlds);
  }

  private static saveAllWorlds(worlds: FusionDNA[]): void {
    this.cachedWorlds = [...worlds];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(worlds));
    } catch (e) {
      console.warn('Failed to save fused worlds to localStorage:', e);
    }
  }

  public static getFavorites(): string[] {
    if (this.cachedFavorites) return [...this.cachedFavorites];
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.cachedFavorites = parsed;
          return [...parsed];
        }
      }
    } catch (e) {
      console.warn('Failed to read favorites:', e);
    }
    this.cachedFavorites = ['preset-ocean-aurora', 'preset-galaxy-blackhole'];
    return [...this.cachedFavorites];
  }

  public static toggleFavorite(id: string): boolean {
    const favs = this.getFavorites();
    const idx = favs.indexOf(id);
    let isFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
      isFav = false;
    } else {
      favs.push(id);
      isFav = true;
    }
    this.cachedFavorites = [...favs];
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    } catch (e) {
      console.warn('Failed to save favorites:', e);
    }
    return isFav;
  }

  public static isFavorite(id: string): boolean {
    return this.getFavorites().includes(id);
  }
}
