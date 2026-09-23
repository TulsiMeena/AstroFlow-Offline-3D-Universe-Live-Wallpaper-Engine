import { BiomeType, WeatherType as EnvWeatherType, TimeOfDay } from '../environment/types/environmentDNA';
import { LifeEntityType } from '../living/EcosystemDNA';
import { WorldDNA } from '../universe/types/worldDNA';
import { EnvironmentDNA } from '../environment/types/environmentDNA';
import { EcosystemDNA } from '../living/EcosystemDNA';
import { FusionDNA } from '../infinite/types/infiniteTypes';
import { DesignDNA, MaterialType } from '../designer/types/designDNA';
import { QualityProfile } from '../types/engine';

export type WorldType =
  | 'SPACE'
  | 'NATURE'
  | 'OCEAN'
  | 'MOUNTAIN'
  | 'FOREST'
  | 'VOLCANO'
  | 'CYBER CITY'
  | 'FANTASY'
  | 'CRYSTAL'
  | 'ENERGY'
  | 'ABSTRACT'
  | 'MIXED'
  | 'RANDOM';

export type WorldStyle =
  | 'REALISTIC-STYLE'
  | 'CINEMATIC'
  | 'FUTURISTIC'
  | 'DREAM'
  | 'DARK'
  | 'AMOLED'
  | 'NEON'
  | 'MYSTICAL'
  | 'MINIMAL'
  | 'CHAOTIC'
  | 'PEACEFUL';

export type WorldAtmosphere =
  | 'CALM'
  | 'DYNAMIC'
  | 'STORMY'
  | 'MYSTERIOUS'
  | 'ENERGETIC'
  | 'DREAMLIKE'
  | 'COSMIC'
  | 'DEEP';

export type WorldMotion =
  | 'STATIC'
  | 'SUBTLE'
  | 'BALANCED'
  | 'DYNAMIC';

export type WorldPerformance =
  | 'BATTERY SAVER'
  | 'BALANCED'
  | 'HIGH QUALITY'
  | 'ULTRA';

export type VariationModifier =
  | 'MORE COSMIC'
  | 'MORE CALM'
  | 'MORE DYNAMIC'
  | 'MORE COLORFUL'
  | 'MORE DARK'
  | 'MORE REALISTIC-STYLE'
  | 'MORE ABSTRACT';

export interface ParsedPromptDirectives {
  recognizedKeywords: string[];
  suggestedWorldType?: WorldType;
  suggestedBiome?: BiomeType;
  suggestedWeather?: EnvWeatherType;
  suggestedTime?: TimeOfDay;
  colorBiases: string[];
  features: {
    hasBlackHole?: boolean;
    hasAurora?: boolean;
    hasNeon?: boolean;
    hasCrystals?: boolean;
    hasLava?: boolean;
    hasOcean?: boolean;
    hasClouds?: boolean;
    hasSnow?: boolean;
    hasPortal?: boolean;
    hasStars?: boolean;
    hasPlanets?: boolean;
  };
}

export interface UniverseRecipe {
  id: string;
  name: string;
  seed: string;
  numericSeed: number;

  worldType: WorldType;
  style: WorldStyle;
  atmosphere: WorldAtmosphere;
  motion: WorldMotion;
  performance: WorldPerformance;
  customPrompt?: string;

  environment: {
    biome: BiomeType;
    terrainType: 'flat' | 'mountains' | 'rolling-hills' | 'canyons' | 'floating-rocks' | 'caves' | 'dunes' | 'cyber-grid' | 'fractal';
    liquidType: 'none' | 'water' | 'lava' | 'plasma' | 'crystals';
    structureType: 'none' | 'trees' | 'bamboo' | 'crystals' | 'skyscrapers' | 'floating-islands' | 'fractals' | 'portals' | 'organic-cells';
  };

  weather: {
    type: EnvWeatherType;
    intensity: number;
    windSpeed: number;
    cloudDensity: number;
  };

  time: {
    timeOfDay: TimeOfDay;
    timeCycleSpeed: number;
  };

  lighting: {
    sunIntensity: number;
    ambientIntensity: number;
    sunColor: string;
    emissiveColor: string;
    hasAurora: boolean;
    hasStars: boolean;
    starDensity: number;
  };

  particles: {
    count: number;
    speed: number;
    size: number;
    color: string;
    turbulence: number;
    type: 'cosmic' | 'dust' | 'bubbles' | 'snow' | 'rain' | 'sparks' | 'cyber' | 'spores';
  };

  physics: {
    gravity: number;
    turbulence: number;
    interactionStrength: number;
    vortexStrength: number;
  };

  ecosystem: {
    enabled: boolean;
    density: number;
    activity: number;
    entities: LifeEntityType[];
  };

  camera: {
    fov: number;
    distance: number;
    driftSpeed: number;
    orbitSpeed: number;
    behavior: 'cinematic-orbit' | 'fly-through' | 'gentle-sway' | 'floating-observer' | 'dynamic-parallex';
  };

  motionProfile: {
    sensitivity: number;
    touchInteraction: boolean;
    parallaxMultiplier: number;
  };

  audio: {
    enabled: boolean;
    sensitivity: number;
    reactiveMode: 'bloom' | 'motion' | 'particles' | 'all';
  };

  effects: {
    bloom: number;
    fog: number;
    atmosphereScale: number;
    postProcessing: boolean;
    amoledBlack: boolean;
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    background: string;
  };

  materials: {
    type: MaterialType;
    roughness: number;
    metalness: number;
    transmission: number;
    emissiveIntensity: number;
  };

  batteryAssessment: {
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    performanceLoad: string;
    recommendedQuality: QualityProfile;
  };

  createdAt: number;
}

export interface PersonalWorld {
  id: string;
  name: string;
  seed: string;
  numericSeed: number;
  recipe: UniverseRecipe;

  // Fully compiled existing DNA systems
  worldDNA: WorldDNA;
  environmentDNA: EnvironmentDNA;
  ecosystemDNA: EcosystemDNA;
  fusionDNA: FusionDNA;
  designDNA: DesignDNA;

  isFavorite: boolean;
  createdAt: number;
  lastModified: number;
}

export interface ShareableWorldCode {
  version: number;
  seed: string;
  name: string;
  recipe: Partial<UniverseRecipe>;
  checksum: string;
}
