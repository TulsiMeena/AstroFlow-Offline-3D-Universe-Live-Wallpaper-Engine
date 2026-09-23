import {
  LibraryWallpaperItem,
  LibraryFilterOptions,
  LibrarySortOption
} from './types';

export class WallpaperFilterEngine {
  /**
   * Applies structured multi-criteria filters to wallpaper items.
   */
  public static filter(items: LibraryWallpaperItem[], options: LibraryFilterOptions): LibraryWallpaperItem[] {
    return items.filter(item => {
      // 1. Category Filter
      if (options.category && options.category !== 'ALL') {
        if (item.category !== options.category) {
          return false;
        }
      }

      // 2. Style Filter
      if (options.style && options.style !== 'ALL') {
        const itemStyle = (item.style || '').toLowerCase();
        const targetStyle = options.style.toLowerCase();
        if (!itemStyle.includes(targetStyle)) {
          return false;
        }
      }

      // 3. Motion Support Filter
      if (options.motion && options.motion !== 'ALL') {
        if (item.motionSupport !== options.motion) {
          return false;
        }
      }

      // 4. Audio Reactive
      if (options.audioReactive && !item.audioReactive) {
        return false;
      }

      // 5. Physics
      if (options.physics && !item.physicsSupport) {
        return false;
      }

      // 6. Living World
      if (options.livingWorld && !item.livingWorld) {
        return false;
      }

      // 7. Battery Impact
      if (options.batteryImpact && options.batteryImpact !== 'ALL') {
        if (item.batteryImpact !== options.batteryImpact) {
          return false;
        }
      }

      // 8. Performance Level
      if (options.performance && options.performance !== 'ALL') {
        if (item.performance !== options.performance) {
          return false;
        }
      }

      // 9. Favorites Only
      if (options.favoriteOnly && !item.isFavorite) {
        return false;
      }

      return true;
    });
  }

  /**
   * Deterministically sorts wallpapers according to selected sort criteria.
   */
  public static sort(items: LibraryWallpaperItem[], sortOption: LibrarySortOption): LibraryWallpaperItem[] {
    const list = [...items];

    switch (sortOption) {
      case 'NEWEST':
        return list.sort((a, b) => b.createdAt - a.createdAt);

      case 'RECENTLY_USED':
        return list.sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));

      case 'FAVORITES':
        return list.sort((a, b) => {
          if (a.isFavorite === b.isFavorite) return b.createdAt - a.createdAt;
          return a.isFavorite ? -1 : 1;
        });

      case 'NAME':
        return list.sort((a, b) => a.name.localeCompare(b.name));

      case 'BATTERY_FRIENDLY': {
        const score = (impact: string) => (impact === 'LOW' ? 3 : impact === 'MEDIUM' ? 2 : 1);
        return list.sort((a, b) => score(b.batteryImpact) - score(a.batteryImpact));
      }

      case 'PERFORMANCE_FRIENDLY': {
        const perfScore = (perf: string) =>
          perf === 'BATTERY SAVER' ? 4 : perf === 'BALANCED' ? 3 : perf === 'HIGH QUALITY' ? 2 : 1;
        return list.sort((a, b) => perfScore(b.performance) - perfScore(a.performance));
      }

      case 'RANDOM':
        // Deterministic pseudorandom pseudo-shuffle by seed
        return list.sort((a, b) => {
          const hashA = (a.numericSeed * 9301 + 49297) % 233280;
          const hashB = (b.numericSeed * 9301 + 49297) % 233280;
          return hashA - hashB;
        });

      default:
        return list;
    }
  }
}
