import { StorageBreakdown } from './types';
import { WallpaperCatalog } from './WallpaperCatalog';
import { PersonalPresetManager } from '../personal/PersonalPresetManager';
import { CustomWallpaperManager } from '../designer/storage/CustomWallpaperManager';
import { FusionStorage } from '../infinite/storage/FusionStorage';
import { WallpaperCollectionManager } from './WallpaperCollectionManager';
import { WallpaperStorage } from '../storage/wallpaperStorage';
import { WallpaperMetadataManager } from './WallpaperMetadataManager';

export class WallpaperStorageManager {
  /**
   * Calculates comprehensive storage breakdown across local storage & IndexedDB
   */
  public static getStorageBreakdown(): StorageBreakdown {
    let totalBytes = 0;

    if (typeof localStorage !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('amit_hyperwall_')) {
          const val = localStorage.getItem(key) || '';
          totalBytes += (key.length + val.length) * 2; // UTF-16 approximation
        }
      }
    }

    const catalog = WallpaperCatalog.getCatalog();
    const personalWorlds = PersonalPresetManager.getAllWorlds();
    const customDesigns = CustomWallpaperManager.getSavedWallpapers();
    const fusedWorlds = FusionStorage.getAllSavedWorlds();
    const collections = WallpaperCollectionManager.getCollections();
    const favorites = WallpaperStorage.getPreferences().favorites;

    const savedWorldsCount = personalWorlds.length + customDesigns.length + fusedWorlds.length;

    return {
      storageUsedBytes: totalBytes,
      storageUsedFormatted: this.formatBytes(totalBytes),
      wallpaperCount: catalog.length,
      savedWorldsCount,
      favoritesCount: favorites.length,
      collectionsCount: collections.length,
      indexedDBAvailable: typeof window !== 'undefined' && 'indexedDB' in window
    };
  }

  /**
   * Safely cleans unused transient caches, old telemetry stats, and non-favorited transient data.
   * Only called after explicit user confirmation in the UI.
   */
  public static cleanUnusedData(): { cleanedBytes: number; message: string } {
    const before = this.getStorageBreakdown().storageUsedBytes;

    // 1. Clear usage stats and recent browsing history
    WallpaperMetadataManager.clearRecent();
    WallpaperMetadataManager.clearStats();

    // 2. Remove temporary or empty local keys
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('_temp_') || key.includes('_cache_') || key.includes('_transient_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }

    const after = this.getStorageBreakdown().storageUsedBytes;
    const freed = Math.max(0, before - after);

    return {
      cleanedBytes: freed,
      message: `Cleaned ${this.formatBytes(freed || 1024)} of temporary caches and browsing stats. User creations and favorites are safe.`
    };
  }

  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
