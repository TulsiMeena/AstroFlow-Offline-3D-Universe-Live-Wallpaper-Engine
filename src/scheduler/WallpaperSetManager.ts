import { WallpaperSet } from './types';
import { SchedulerStorageManager } from './SchedulerStorageManager';

export class WallpaperSetManager {
  private static instance: WallpaperSetManager;
  private sets: WallpaperSet[] = [];

  private constructor() {
    this.sets = SchedulerStorageManager.loadSets();
  }

  public static getInstance(): WallpaperSetManager {
    if (!WallpaperSetManager.instance) {
      WallpaperSetManager.instance = new WallpaperSetManager();
    }
    return WallpaperSetManager.instance;
  }

  public getAllSets(): WallpaperSet[] {
    return [...this.sets];
  }

  public getSetById(id: string): WallpaperSet | null {
    return this.sets.find((s) => s.id === id) || null;
  }

  public createSet(
    name: string,
    description: string,
    wallpaperIds: string[] = [],
    color: string = '#00F0FF'
  ): WallpaperSet {
    const newSet: WallpaperSet = {
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim() || 'New Wallpaper Pack',
      description: description.trim() || 'Custom curated wallpaper set',
      wallpaperIds: [...wallpaperIds],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
      shuffle: false,
      currentPlaybackIndex: 0,
      color
    };

    this.sets.push(newSet);
    this.save();
    return newSet;
  }

  public updateSet(updated: WallpaperSet): boolean {
    const idx = this.sets.findIndex((s) => s.id === updated.id);
    if (idx === -1) return false;
    this.sets[idx] = { ...updated, updatedAt: Date.now() };
    this.save();
    return true;
  }

  public deleteSet(id: string): boolean {
    const initialLen = this.sets.length;
    this.sets = this.sets.filter((s) => s.id !== id);
    if (this.sets.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public duplicateSet(id: string): WallpaperSet | null {
    const original = this.getSetById(id);
    if (!original) return null;

    const copy: WallpaperSet = {
      ...original,
      id: `set-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: `${original.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.sets.push(copy);
    this.save();
    return copy;
  }

  public addWallpaperToSet(setId: string, wallpaperId: string): boolean {
    const set = this.getSetById(setId);
    if (!set) return false;
    if (!set.wallpaperIds.includes(wallpaperId)) {
      set.wallpaperIds.push(wallpaperId);
      set.updatedAt = Date.now();
      this.save();
    }
    return true;
  }

  public removeWallpaperFromSet(setId: string, wallpaperId: string): boolean {
    const set = this.getSetById(setId);
    if (!set) return false;
    set.wallpaperIds = set.wallpaperIds.filter((id) => id !== wallpaperId);
    set.updatedAt = Date.now();
    this.save();
    return true;
  }

  public reorderWallpapers(setId: string, newWallpaperIds: string[]): boolean {
    const set = this.getSetById(setId);
    if (!set) return false;
    set.wallpaperIds = [...newWallpaperIds];
    set.updatedAt = Date.now();
    this.save();
    return true;
  }

  public toggleFavorite(setId: string): boolean {
    const set = this.getSetById(setId);
    if (!set) return false;
    set.isFavorite = !set.isFavorite;
    set.updatedAt = Date.now();
    this.save();
    return true;
  }

  public toggleShuffle(setId: string): boolean {
    const set = this.getSetById(setId);
    if (!set) return false;
    set.shuffle = !set.shuffle;
    set.updatedAt = Date.now();
    this.save();
    return true;
  }

  public getNextWallpaperInSet(setId: string): string | null {
    const set = this.getSetById(setId);
    if (!set || set.wallpaperIds.length === 0) return null;

    if (set.shuffle) {
      const randIdx = Math.floor(Math.random() * set.wallpaperIds.length);
      return set.wallpaperIds[randIdx];
    } else {
      const nextIdx = (set.currentPlaybackIndex + 1) % set.wallpaperIds.length;
      set.currentPlaybackIndex = nextIdx;
      this.save();
      return set.wallpaperIds[nextIdx];
    }
  }

  private save() {
    SchedulerStorageManager.saveSets(this.sets);
  }
}
