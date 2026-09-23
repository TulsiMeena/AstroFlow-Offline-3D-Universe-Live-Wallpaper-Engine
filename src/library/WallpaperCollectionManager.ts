import { LibraryCollection } from './types';

const STORAGE_KEY_COLLECTIONS = 'amit_hyperwall_collections_v1';

export class WallpaperCollectionManager {
  private static cachedCollections: LibraryCollection[] | null = null;

  public static getCollections(): LibraryCollection[] {
    if (this.cachedCollections) {
      return [...this.cachedCollections];
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.cachedCollections = parsed;
          return [...parsed];
        }
      }
    } catch (e) {
      console.warn('Failed to read collections from localStorage:', e);
    }

    // Default Curated Collections
    const defaults: LibraryCollection[] = [
      {
        id: 'col-my-space',
        name: 'My Space',
        description: 'Cosmic voids, galaxies, nebulas, and planetary systems.',
        icon: 'Orbit',
        wallpaperIds: ['cosmic-particle-field', 'galaxy-core', 'black-hole', 'deep-space', 'procedural-nebula'],
        createdAt: 1710000000000,
        lastModified: 1710000000000,
        isSystem: true
      },
      {
        id: 'col-my-nature',
        name: 'My Nature',
        description: 'Living biomes, rain, aurora skies, and oceanic depths.',
        icon: 'TreePine',
        wallpaperIds: ['aurora-sky', 'env-living-forest', 'env-ocean-world', 'liquid-ripple'],
        createdAt: 1710000000000,
        lastModified: 1710000000000,
        isSystem: true
      },
      {
        id: 'col-battery-friendly',
        name: 'Battery Friendly',
        description: 'Optimized low-draw procedural wallpapers for maximum power savings.',
        icon: 'BatteryCharging',
        wallpaperIds: ['cyber-grid', 'aurora-sky', 'liquid-ripple'],
        createdAt: 1710000000000,
        lastModified: 1710000000000,
        isSystem: true
      },
      {
        id: 'col-night-wallpapers',
        name: 'Night Wallpapers',
        description: 'Deep AMOLED blacks and low-luminance glowing procedurals.',
        icon: 'Moon',
        wallpaperIds: ['black-hole', 'cyber-grid', 'deep-space'],
        createdAt: 1710000000000,
        lastModified: 1710000000000,
        isSystem: true
      }
    ];

    this.cachedCollections = defaults;
    this.saveAll(defaults);
    return [...defaults];
  }

  public static createCollection(name: string, description: string = '', icon: string = 'Folder'): LibraryCollection {
    const list = this.getCollections();
    const cleanName = name.trim() || 'New Collection';
    const id = `col-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newCollection: LibraryCollection = {
      id,
      name: cleanName,
      description: description.trim() || 'Custom personal collection.',
      icon,
      wallpaperIds: [],
      createdAt: Date.now(),
      lastModified: Date.now(),
      isSystem: false
    };

    list.unshift(newCollection);
    this.cachedCollections = list;
    this.saveAll(list);
    return newCollection;
  }

  public static renameCollection(id: string, newName: string, newDesc?: string): boolean {
    const list = this.getCollections();
    const col = list.find(c => c.id === id);
    if (!col) return false;

    col.name = newName.trim() || col.name;
    if (newDesc !== undefined) col.description = newDesc.trim();
    col.lastModified = Date.now();

    this.cachedCollections = list;
    this.saveAll(list);
    return true;
  }

  public static deleteCollection(id: string): boolean {
    const list = this.getCollections().filter(c => c.id !== id);
    this.cachedCollections = list;
    this.saveAll(list);
    return true;
  }

  public static addWallpaperToCollection(collectionId: string, wallpaperId: string): boolean {
    const list = this.getCollections();
    const col = list.find(c => c.id === collectionId);
    if (!col) return false;

    if (!col.wallpaperIds.includes(wallpaperId)) {
      col.wallpaperIds.push(wallpaperId);
      col.lastModified = Date.now();
      this.cachedCollections = list;
      this.saveAll(list);
    }
    return true;
  }

  public static removeWallpaperFromCollection(collectionId: string, wallpaperId: string): boolean {
    const list = this.getCollections();
    const col = list.find(c => c.id === collectionId);
    if (!col) return false;

    col.wallpaperIds = col.wallpaperIds.filter(id => id !== wallpaperId);
    col.lastModified = Date.now();
    this.cachedCollections = list;
    this.saveAll(list);
    return true;
  }

  public static getCollectionsForWallpaper(wallpaperId: string): LibraryCollection[] {
    const list = this.getCollections();
    return list.filter(c => c.wallpaperIds.includes(wallpaperId));
  }

  private static saveAll(list: LibraryCollection[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to persist collections:', e);
    }
  }
}
