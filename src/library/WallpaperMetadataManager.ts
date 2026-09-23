const STORAGE_KEY_RECENT = 'amit_hyperwall_recent_wallpapers_v1';
const STORAGE_KEY_STATS = 'amit_hyperwall_wallpaper_stats_v1';

export interface WallpaperUsageStat {
  id: string;
  viewCount: number;
  lastOpenedAt: number;
  totalDurationMs?: number;
}

export class WallpaperMetadataManager {
  private static cachedRecent: string[] | null = null;
  private static cachedStats: Record<string, WallpaperUsageStat> | null = null;

  public static getRecentWallpaperIds(): string[] {
    if (this.cachedRecent) return [...this.cachedRecent];

    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.cachedRecent = parsed.filter(id => typeof id === 'string');
          return [...this.cachedRecent];
        }
      }
    } catch (e) {
      console.warn('Failed to read recent wallpapers:', e);
    }

    this.cachedRecent = [];
    return [];
  }

  public static recordOpen(wallpaperId: string): void {
    if (!wallpaperId) return;

    // 1. Update Recent
    const recents = this.getRecentWallpaperIds().filter(id => id !== wallpaperId);
    recents.unshift(wallpaperId);
    // Keep top 30
    if (recents.length > 30) recents.length = 30;
    this.cachedRecent = recents;
    try {
      localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(recents));
    } catch (e) {
      console.warn('Failed to save recents:', e);
    }

    // 2. Update Stats
    const stats = this.getAllStats();
    const stat = stats[wallpaperId] || {
      id: wallpaperId,
      viewCount: 0,
      lastOpenedAt: 0
    };
    stat.viewCount += 1;
    stat.lastOpenedAt = Date.now();
    stats[wallpaperId] = stat;
    this.cachedStats = stats;
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Failed to save stats:', e);
    }
  }

  public static getAllStats(): Record<string, WallpaperUsageStat> {
    if (this.cachedStats) return { ...this.cachedStats };

    try {
      const raw = localStorage.getItem(STORAGE_KEY_STATS);
      if (raw) {
        this.cachedStats = JSON.parse(raw) || {};
        return { ...(this.cachedStats || {}) };
      }
    } catch (e) {
      console.warn('Failed to read stats:', e);
    }

    this.cachedStats = {};
    return {};
  }

  public static getStat(wallpaperId: string): WallpaperUsageStat | null {
    const all = this.getAllStats();
    return all[wallpaperId] || null;
  }

  public static clearRecent(): void {
    this.cachedRecent = [];
    try {
      localStorage.removeItem(STORAGE_KEY_RECENT);
    } catch (e) {
      console.warn('Failed to clear recents:', e);
    }
  }

  public static clearStats(): void {
    this.cachedStats = {};
    try {
      localStorage.removeItem(STORAGE_KEY_STATS);
    } catch (e) {
      console.warn('Failed to clear stats:', e);
    }
  }
}
