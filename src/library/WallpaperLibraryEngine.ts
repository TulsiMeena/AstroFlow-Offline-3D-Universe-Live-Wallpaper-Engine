import {
  LibraryWallpaperItem,
  LibraryFilterOptions,
  LibrarySortOption,
  LibraryCollection,
  RecommendationResult,
  StorageBreakdown
} from './types';
import { WallpaperCatalog } from './WallpaperCatalog';
import { WallpaperSearchEngine } from './WallpaperSearchEngine';
import { WallpaperFilterEngine } from './WallpaperFilterEngine';
import { WallpaperCollectionManager } from './WallpaperCollectionManager';
import { WallpaperMetadataManager } from './WallpaperMetadataManager';
import { WallpaperRecommendationEngine } from './WallpaperRecommendationEngine';
import { WallpaperPreviewManager } from './WallpaperPreviewManager';
import { WallpaperImportExport, ImportResult } from './WallpaperImportExport';
import { WallpaperStorageManager } from './WallpaperStorageManager';
import { WallpaperStorage } from '../storage/wallpaperStorage';

export class WallpaperLibraryEngine {
  private static instance: WallpaperLibraryEngine;

  private constructor() {}

  public static getInstance(): WallpaperLibraryEngine {
    if (!WallpaperLibraryEngine.instance) {
      WallpaperLibraryEngine.instance = new WallpaperLibraryEngine();
    }
    return WallpaperLibraryEngine.instance;
  }

  // 1. Catalog Access
  public getCatalog(forceRefresh: boolean = false): LibraryWallpaperItem[] {
    return WallpaperCatalog.getCatalog(forceRefresh);
  }

  public getWallpaperById(id: string): LibraryWallpaperItem | null {
    return WallpaperCatalog.getItemById(id);
  }

  // 2. Search & Filtering
  public queryWallpapers(
    filterOptions: LibraryFilterOptions,
    sortOption: LibrarySortOption = 'NEWEST'
  ): LibraryWallpaperItem[] {
    let items = this.getCatalog();

    // 1. Text Search
    if (filterOptions.searchQuery) {
      items = WallpaperSearchEngine.search(items, filterOptions.searchQuery);
    }

    // 2. Structured Filter
    items = WallpaperFilterEngine.filter(items, filterOptions);

    // 3. Sort
    items = WallpaperFilterEngine.sort(items, sortOption);

    return items;
  }

  // 3. Collections
  public getCollections(): LibraryCollection[] {
    return WallpaperCollectionManager.getCollections();
  }

  public createCollection(name: string, description?: string, icon?: string): LibraryCollection {
    return WallpaperCollectionManager.createCollection(name, description, icon);
  }

  public renameCollection(id: string, newName: string, newDesc?: string): boolean {
    return WallpaperCollectionManager.renameCollection(id, newName, newDesc);
  }

  public deleteCollection(id: string): boolean {
    return WallpaperCollectionManager.deleteCollection(id);
  }

  public addWallpaperToCollection(collectionId: string, wallpaperId: string): boolean {
    return WallpaperCollectionManager.addWallpaperToCollection(collectionId, wallpaperId);
  }

  public removeWallpaperFromCollection(collectionId: string, wallpaperId: string): boolean {
    return WallpaperCollectionManager.removeWallpaperFromCollection(collectionId, wallpaperId);
  }

  public getCollectionsForWallpaper(wallpaperId: string): LibraryCollection[] {
    return WallpaperCollectionManager.getCollectionsForWallpaper(wallpaperId);
  }

  // 4. Favorites & Stats
  public toggleFavorite(wallpaperId: string): boolean {
    const isFav = WallpaperStorage.toggleFavorite(wallpaperId);
    WallpaperCatalog.getCatalog(true); // refresh cache
    return isFav;
  }

  public recordWallpaperOpened(wallpaperId: string): void {
    WallpaperMetadataManager.recordOpen(wallpaperId);
  }

  public getRecentWallpaperIds(): string[] {
    return WallpaperMetadataManager.getRecentWallpaperIds();
  }

  // 5. Local Recommendations
  public getRecommendations(currentCategory?: string, limit: number = 8): RecommendationResult[] {
    const catalog = this.getCatalog();
    return WallpaperRecommendationEngine.getRecommendations(catalog, currentCategory, limit);
  }

  // 6. Preview Management
  public getPreviewManager(): WallpaperPreviewManager {
    return WallpaperPreviewManager.getInstance();
  }

  // 7. Import & Export
  public exportWallpaperCode(wallpaper: LibraryWallpaperItem): string {
    return WallpaperImportExport.exportToCode(wallpaper);
  }

  public exportWallpaperJSON(wallpaper: LibraryWallpaperItem): string {
    return WallpaperImportExport.exportToJSON(wallpaper);
  }

  public importWallpaper(codeOrJSON: string): ImportResult {
    const res = WallpaperImportExport.importFromCodeOrJSON(codeOrJSON);
    if (res.success) {
      WallpaperCatalog.getCatalog(true); // force refresh
    }
    return res;
  }

  // 8. Storage Management
  public getStorageBreakdown(): StorageBreakdown {
    return WallpaperStorageManager.getStorageBreakdown();
  }

  public cleanUnusedData(): { cleanedBytes: number; message: string } {
    const res = WallpaperStorageManager.cleanUnusedData();
    WallpaperCatalog.getCatalog(true);
    return res;
  }
}
