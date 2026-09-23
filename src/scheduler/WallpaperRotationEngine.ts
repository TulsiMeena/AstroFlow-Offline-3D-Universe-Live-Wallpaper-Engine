import { RotationMode, WallpaperSet } from './types';
import { WallpaperCatalog } from '../library/WallpaperCatalog';
import { DeviceStateAdapter } from './DeviceStateAdapter';

export interface SmartRotationOptions {
  excludeRecentIds?: string[];
  preferAmoled?: boolean;
  preferCategory?: string;
  seed?: number;
}

export class WallpaperRotationEngine {
  private static instance: WallpaperRotationEngine;
  private intervalTimerId: any = null;
  private lastRotationTimestamp: number = 0;
  private currentIntervalMinutes: number = 15;
  private currentMode: RotationMode = 'SCHEDULED';
  private activeSet: WallpaperSet | null = null;
  private recentHistoryIds: string[] = [];
  private onRotateCallback: ((nextWallpaperId: string, reason: string) => void) | null = null;

  private constructor() {
    // Listen for tab visibility changes
    const adapter = DeviceStateAdapter.getInstance();
    adapter.subscribe({
      onVisibilityChange: (isVisible) => {
        if (!isVisible) {
          this.pauseTimer();
        } else {
          this.resumeTimerIfNeeded();
        }
      }
    });
  }

  public static getInstance(): WallpaperRotationEngine {
    if (!WallpaperRotationEngine.instance) {
      WallpaperRotationEngine.instance = new WallpaperRotationEngine();
    }
    return WallpaperRotationEngine.instance;
  }

  public setOnRotateCallback(cb: (nextWallpaperId: string, reason: string) => void) {
    this.onRotateCallback = cb;
  }

  public configure(mode: RotationMode, intervalMinutes: number, activeSet?: WallpaperSet | null) {
    this.currentMode = mode;
    this.currentIntervalMinutes = Math.max(1, intervalMinutes);
    this.activeSet = activeSet || null;

    this.startIntervalTimer();
  }

  public stop() {
    this.pauseTimer();
  }

  private startIntervalTimer() {
    this.pauseTimer();

    if (this.currentMode === 'MANUAL') {
      return;
    }

    const intervalMs = this.currentIntervalMinutes * 60 * 1000;
    this.intervalTimerId = setInterval(() => {
      this.executeIntervalStep();
    }, intervalMs);

    this.lastRotationTimestamp = Date.now();
  }

  private pauseTimer() {
    if (this.intervalTimerId !== null) {
      clearInterval(this.intervalTimerId);
      this.intervalTimerId = null;
    }
  }

  private resumeTimerIfNeeded() {
    if (this.currentMode !== 'MANUAL' && this.intervalTimerId === null) {
      // Check elapsed time
      const elapsed = Date.now() - this.lastRotationTimestamp;
      const intervalMs = this.currentIntervalMinutes * 60 * 1000;

      if (elapsed >= intervalMs) {
        this.executeIntervalStep();
      }
      this.startIntervalTimer();
    }
  }

  public executeIntervalStep() {
    const nextId = this.computeNextWallpaper();
    if (nextId) {
      this.recentHistoryIds.unshift(nextId);
      if (this.recentHistoryIds.length > 8) {
        this.recentHistoryIds.pop();
      }
      this.lastRotationTimestamp = Date.now();
      this.onRotateCallback?.(nextId, `Rotation Interval (${this.currentMode})`);
    }
  }

  /**
   * Computes the next wallpaper based on active rotation mode.
   */
  public computeNextWallpaper(options?: SmartRotationOptions): string | null {
    const catalog = WallpaperCatalog.getCatalog();
    if (catalog.length === 0) return null;

    // 1. If an active WallpaperSet is assigned
    if (this.activeSet && this.activeSet.wallpaperIds.length > 0) {
      const ids = this.activeSet.wallpaperIds;
      if (this.currentMode === 'RANDOM' || this.activeSet.shuffle) {
        const unplayed = ids.filter((id) => !this.recentHistoryIds.slice(0, 3).includes(id));
        const pool = unplayed.length > 0 ? unplayed : ids;
        const picked = pool[Math.floor(Math.random() * pool.length)];
        return picked;
      } else {
        // Sequential
        const idx = (this.activeSet.currentPlaybackIndex + 1) % ids.length;
        this.activeSet.currentPlaybackIndex = idx;
        return ids[idx];
      }
    }

    // 2. Global Catalog Rotation Modes
    switch (this.currentMode) {
      case 'RANDOM': {
        const pool = catalog.filter((item) => !this.recentHistoryIds.slice(0, 4).includes(item.id));
        const candidates = pool.length > 0 ? pool : catalog;
        const picked = candidates[Math.floor(Math.random() * candidates.length)];
        return picked.id;
      }

      case 'SMART': {
        // Smart diverse selection: avoid recent category, prefer favorites or battery match
        const recentItems = this.recentHistoryIds
          .map((id) => catalog.find((c) => c.id === id))
          .filter(Boolean);
        const lastCategory = recentItems[0]?.category;

        let filtered = catalog.filter((c) => !this.recentHistoryIds.slice(0, 4).includes(c.id));
        if (filtered.length === 0) filtered = catalog;

        // Diversity filter
        if (lastCategory && filtered.some((c) => c.category !== lastCategory)) {
          filtered = filtered.filter((c) => c.category !== lastCategory);
        }

        // Battery workload filter
        if (options?.preferAmoled) {
          const amoled = filtered.filter((c) => c.tags.includes('AMOLED') || c.category === 'COSMIC');
          if (amoled.length > 0) filtered = amoled;
        }

        // Favorite bias (50% chance to pick from favorites if available)
        const favorites = filtered.filter((c) => c.isFavorite);
        if (favorites.length > 0 && Math.random() > 0.5) {
          return favorites[Math.floor(Math.random() * favorites.length)].id;
        }

        const picked = filtered[Math.floor(Math.random() * filtered.length)];
        return picked ? picked.id : catalog[0].id;
      }

      case 'SEQUENTIAL':
      case 'FIXED_INTERVAL':
      default: {
        const lastIndex = catalog.findIndex((c) => c.id === this.recentHistoryIds[0]);
        const nextIndex = (lastIndex + 1) % catalog.length;
        return catalog[nextIndex].id;
      }
    }
  }

  public getTimeUntilNextRotation(): number {
    if (this.currentMode === 'MANUAL') return 0;
    const intervalMs = this.currentIntervalMinutes * 60 * 1000;
    const elapsed = Date.now() - this.lastRotationTimestamp;
    const remainingMs = Math.max(0, intervalMs - elapsed);
    return Math.ceil(remainingMs / 1000);
  }
}
