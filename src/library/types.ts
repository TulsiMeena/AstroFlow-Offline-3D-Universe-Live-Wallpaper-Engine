import { QualityProfile } from '../types/engine';
import { WorldType, WorldStyle, PersonalWorld } from '../personal/types';
import { DesignDNA } from '../designer/types/designDNA';
import { FusionDNA } from '../infinite/types/infiniteTypes';
import { WallpaperMetadata } from '../types/wallpaper';

export type LibraryCategory =
  | 'COSMIC'
  | 'NATURE'
  | 'WEATHER'
  | 'ELEMENTS'
  | 'FUTURISTIC'
  | 'FANTASY'
  | 'ABSTRACT'
  | 'INTERACTIVE'
  | 'LIVING WORLDS'
  | 'MIXED WORLDS';

export type LibrarySection =
  | 'HOME'
  | 'EXPLORE'
  | 'MY WALLPAPERS'
  | 'FAVORITES'
  | 'RECENT'
  | 'COLLECTIONS'
  | 'CREATED BY ME';

export type BatteryImpactLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type PerformanceLevel = 'BATTERY SAVER' | 'BALANCED' | 'HIGH QUALITY' | 'ULTRA';
export type MotionSupportLevel = 'STATIC' | 'SUBTLE' | 'BALANCED' | 'DYNAMIC';

export type WallpaperSourceType = 'built-in' | 'personal' | 'fusion' | 'infinite';

export interface LibraryWallpaperItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: LibraryCategory;
  source: WallpaperSourceType;
  seed: string;
  numericSeed: number;
  environment: string;
  style: string;
  weather: string;
  tags: string[];
  accentColor: string;
  secondaryColor: string;

  // Features
  motionSupport: MotionSupportLevel;
  interactiveSupport: boolean;
  audioReactive: boolean;
  physicsSupport: boolean;
  livingWorld: boolean;

  // Efficiency
  batteryImpact: BatteryImpactLevel;
  performance: PerformanceLevel;

  // Metadata
  author: string;
  createdAt: number;
  lastOpenedAt?: number;
  isFavorite: boolean;
  viewCount: number;

  // Underlying Payload
  personalWorld?: PersonalWorld;
  designDNA?: DesignDNA;
  fusionDNA?: FusionDNA;
  builtinMetadata?: WallpaperMetadata;
}

export interface LibraryCollection {
  id: string;
  name: string;
  description: string;
  icon: string;
  wallpaperIds: string[];
  createdAt: number;
  lastModified: number;
  isSystem?: boolean;
}

export interface LibraryFilterOptions {
  category: LibraryCategory | 'ALL';
  style?: string;
  motion?: MotionSupportLevel | 'ALL';
  audioReactive?: boolean;
  physics?: boolean;
  livingWorld?: boolean;
  batteryImpact?: BatteryImpactLevel | 'ALL';
  performance?: PerformanceLevel | 'ALL';
  favoriteOnly?: boolean;
  searchQuery?: string;
}

export type LibrarySortOption =
  | 'NEWEST'
  | 'RECENTLY_USED'
  | 'FAVORITES'
  | 'NAME'
  | 'BATTERY_FRIENDLY'
  | 'PERFORMANCE_FRIENDLY'
  | 'RANDOM';

export interface StorageBreakdown {
  storageUsedBytes: number;
  storageUsedFormatted: string;
  wallpaperCount: number;
  savedWorldsCount: number;
  favoritesCount: number;
  collectionsCount: number;
  indexedDBAvailable: boolean;
}

export interface RecommendationResult {
  wallpaper: LibraryWallpaperItem;
  reason: string;
  score: number;
}
