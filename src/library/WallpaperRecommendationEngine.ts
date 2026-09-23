import { LibraryWallpaperItem, RecommendationResult } from './types';
import { WallpaperMetadataManager } from './WallpaperMetadataManager';
import { WallpaperStorage } from '../storage/wallpaperStorage';

export class WallpaperRecommendationEngine {
  /**
   * Deterministically calculates local recommendations for the user.
   */
  public static getRecommendations(
    catalog: LibraryWallpaperItem[],
    currentCategory?: string,
    limit: number = 8
  ): RecommendationResult[] {
    const preferences = WallpaperStorage.getPreferences();
    const recentIds = WallpaperMetadataManager.getRecentWallpaperIds();
    const favoriteIds = new Set(preferences.favorites);

    // Identify user preferences profiles
    const recentItems = catalog.filter(i => recentIds.includes(i.id));
    const favoriteItems = catalog.filter(i => favoriteIds.has(i.id));
    const createdItems = catalog.filter(i => i.source === 'personal' || i.source === 'fusion');

    // Extract preferred tags and categories
    const preferredCategories = new Map<string, number>();
    const preferredTags = new Map<string, number>();

    [...favoriteItems, ...recentItems, ...createdItems].forEach(item => {
      preferredCategories.set(item.category, (preferredCategories.get(item.category) || 0) + 1);
      (item.tags || []).forEach(tag => {
        preferredTags.set(tag, (preferredTags.get(tag) || 0) + 1);
      });
    });

    const results: RecommendationResult[] = [];

    for (const item of catalog) {
      let score = 0;
      let primaryReason = 'Discover Procedural Visuals';

      // 1. Current category affinity
      if (currentCategory && currentCategory !== 'ALL' && item.category === currentCategory) {
        score += 25;
        primaryReason = `Popular in ${currentCategory}`;
      }

      // 2. Favorite similarity
      if (preferredCategories.has(item.category)) {
        const catFreq = preferredCategories.get(item.category)!;
        score += Math.min(30, catFreq * 8);
        if (catFreq >= 2) {
          primaryReason = `Matches your affinity for ${item.category}`;
        }
      }

      // 3. Tag overlap
      let tagMatches = 0;
      (item.tags || []).forEach(tag => {
        if (preferredTags.has(tag)) {
          tagMatches += 1;
        }
      });
      score += Math.min(25, tagMatches * 5);
      if (tagMatches >= 2) {
        primaryReason = `Matches procedural tags you frequently enjoy`;
      }

      // 4. Battery / Performance preference bonus
      if (preferences.qualityProfile === 'LOW' || preferences.targetFPS <= 30) {
        if (item.batteryImpact === 'LOW') {
          score += 35;
          primaryReason = 'Ultra-low battery draw for power saving';
        }
      } else if (preferences.qualityProfile === 'HIGH') {
        if (item.performance === 'HIGH QUALITY' || item.performance === 'ULTRA') {
          score += 20;
          primaryReason = 'High fidelity shader aesthetics';
        }
      }

      // 5. Creator resonance
      if (createdItems.length > 0 && item.source === 'built-in') {
        const matchingEnv = createdItems.some(c => c.environment === item.environment);
        if (matchingEnv) {
          score += 15;
          primaryReason = `Complements worlds you created`;
        }
      }

      // Slight diversity factor using seed
      const diversity = (item.numericSeed % 10);
      score += diversity;

      results.push({
        wallpaper: item,
        score,
        reason: primaryReason
      });
    }

    // Sort descending by recommendation score
    results.sort((a, b) => b.score - a.score);

    // Filter out wallpapers that are actively in active view if enough candidates exist
    return results.slice(0, limit);
  }
}
