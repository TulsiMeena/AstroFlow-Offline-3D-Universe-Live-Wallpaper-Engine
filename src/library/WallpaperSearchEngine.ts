import { LibraryWallpaperItem } from './types';

export class WallpaperSearchEngine {
  /**
   * Performs fast local multi-token search across wallpaper fields.
   */
  public static search(items: LibraryWallpaperItem[], rawQuery: string): LibraryWallpaperItem[] {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return items;

    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return items;

    return items.filter(item => {
      // Build composite searchable index for this wallpaper
      const searchableBlob = [
        item.name,
        item.subtitle,
        item.description,
        item.category,
        item.environment,
        item.style,
        item.weather,
        item.seed,
        item.batteryImpact,
        item.performance,
        item.author,
        item.source,
        ...(item.tags || [])
      ].join(' ').toLowerCase();

      // Check if all tokens match or if any matches high relevance
      return tokens.every(token => {
        // Special alias handling:
        if (token === 'battery' || token === 'saver') {
          return searchableBlob.includes('battery') || item.batteryImpact === 'LOW' || item.performance === 'BATTERY SAVER';
        }
        if (token === 'favorite' || token === 'fav') {
          return item.isFavorite;
        }
        if (token === 'living') {
          return item.livingWorld || searchableBlob.includes('living');
        }
        if (token === 'physics') {
          return item.physicsSupport;
        }
        if (token === 'audio') {
          return item.audioReactive;
        }
        return searchableBlob.includes(token);
      });
    });
  }
}
