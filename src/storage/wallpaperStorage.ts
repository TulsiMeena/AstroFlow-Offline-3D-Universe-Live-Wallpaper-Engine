import { QualityProfile } from '../types/engine';

export interface UserPreferences {
  activeWallpaperId: string;
  favorites: string[];
  qualityProfile: QualityProfile;
  animationPaused: boolean;
  targetFPS: number;
  motionSensitivity: number;
  motionSmoothing: number;
  motionEnabled: boolean;
  reducedMotion: boolean;
  touchInteractionEnabled: boolean;
  developerMode: boolean;
  showFpsCounter: boolean;
  immersiveMode: boolean;
}

const STORAGE_KEY = 'amit_hyperwall_prefs_v2';

const DEFAULT_PREFERENCES: UserPreferences = {
  activeWallpaperId: 'cosmic-particle-field',
  favorites: ['cosmic-particle-field', 'galaxy-core', 'black-hole'],
  qualityProfile: 'HIGH',
  animationPaused: false,
  targetFPS: 60,
  motionSensitivity: 1.0,
  motionSmoothing: 0.1,
  motionEnabled: true,
  reducedMotion: false,
  touchInteractionEnabled: true,
  developerMode: false,
  showFpsCounter: false,
  immersiveMode: false
};

export class WallpaperStorage {
  private static cachedPrefs: UserPreferences | null = null;

  public static getPreferences(): UserPreferences {
    if (this.cachedPrefs) return { ...this.cachedPrefs };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<UserPreferences>;
        this.cachedPrefs = Object.assign({}, DEFAULT_PREFERENCES, parsed);
        return { ...this.cachedPrefs };
      }
    } catch (e) {
      console.warn('Failed to load preferences from localStorage:', e);
    }

    this.cachedPrefs = { ...DEFAULT_PREFERENCES };
    return { ...this.cachedPrefs };
  }

  public static savePreferences(prefs: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    this.cachedPrefs = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to persist preferences:', e);
    }

    return { ...updated };
  }

  public static toggleFavorite(wallpaperId: string): boolean {
    const prefs = this.getPreferences();
    const favSet = new Set(prefs.favorites);
    let isFav = false;

    if (favSet.has(wallpaperId)) {
      favSet.delete(wallpaperId);
      isFav = false;
    } else {
      favSet.add(wallpaperId);
      isFav = true;
    }

    this.savePreferences({ favorites: Array.from(favSet) });
    return isFav;
  }

  public static isFavorite(wallpaperId: string): boolean {
    const prefs = this.getPreferences();
    return prefs.favorites.includes(wallpaperId);
  }
}
