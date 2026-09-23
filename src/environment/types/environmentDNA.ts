export type BiomeCategory = 'Nature' | 'Weather' | 'Elements' | 'Futuristic' | 'Fantasy';

export type BiomeType =
  // Nature
  | 'ocean-world'
  | 'underwater-world'
  | 'living-forest'
  | 'bamboo-forest'
  | 'mountain-world'
  | 'mountain-clouds'
  | 'waterfall-world'
  | 'tropical-world'
  | 'desert-oasis'
  | 'cave-world'
  // Weather
  | 'rain-world'
  | 'heavy-rain'
  | 'snow-world'
  | 'thunder-storm'
  | 'wind-storm'
  | 'fog-world'
  | 'aurora-world'
  | 'sunset-sunrise'
  // Elements
  | 'volcano-world'
  | 'lava-flow'
  | 'fire-ember'
  | 'lightning-world'
  | 'plasma-world'
  | 'energy-world'
  | 'liquid-world'
  | 'smoke-fog'
  // Futuristic
  | 'cyber-city'
  | 'neon-highway'
  | 'futuristic-city'
  | 'hologram-city'
  | 'space-city'
  | 'scifi-station'
  | 'robot-mechanical'
  | 'digital-grid'
  // Fantasy / Abstract
  | 'crystal-world'
  | 'liquid-glass'
  | 'floating-islands'
  | 'fractal-world'
  | 'organic-world'
  | 'micro-world'
  | 'dream-world'
  | 'portal-world'
  | 'time-tunnel';

export type WeatherType = 'clear' | 'rain' | 'heavy-rain' | 'snow' | 'storm' | 'fog' | 'aurora' | 'embers' | 'spores' | 'cyber-dust';

export type TimeOfDay = 'dawn' | 'day' | 'sunset' | 'twilight' | 'night';

export type CameraBehavior = 'cinematic-orbit' | 'fly-through' | 'gentle-sway' | 'floating-observer' | 'dynamic-parallex';

export interface TerrainDNA {
  type: 'flat' | 'mountains' | 'rolling-hills' | 'canyons' | 'floating-rocks' | 'caves' | 'dunes' | 'cyber-grid' | 'fractal';
  heightScale: number; // 0.1 - 4.0
  roughness: number; // 0.1 - 3.0
  plateauRatio: number; // 0.0 - 1.0
  colorPrimary: string;
  colorSecondary: string;
  colorRock: string;
  wireframe: boolean;
}

export interface AtmosphereDNA {
  fogDensity: number; // 0.001 - 0.1
  fogColor: string;
  skyColorTop: string;
  skyColorBottom: string;
  ambientIntensity: number; // 0.1 - 2.0
  sunIntensity: number; // 0.0 - 3.0
  sunColor: string;
  hasAurora: boolean;
  auroraColorA: string;
  auroraColorB: string;
  hasStars: boolean;
  starDensity: number; // 500 - 10000
}

export interface WeatherDNA {
  type: WeatherType;
  intensity: number; // 0.0 - 2.0
  windSpeed: number; // 0.0 - 5.0
  windDirection: [number, number, number]; // normalized vector
  particleCount: number; // 500 - 12000
  lightningFrequency: number; // 0.0 - 1.0
  cloudDensity: number; // 0.0 - 1.0
}

export interface LiquidDNA {
  hasWater: boolean;
  waterLevel: number; // -5.0 to 5.0
  waterColor: string;
  waterDeepColor: string;
  waveHeight: number; // 0.0 - 2.0
  waveSpeed: number; // 0.1 - 3.0
  hasFoam: boolean;
  hasUnderwaterDepth: boolean;

  hasLava: boolean;
  lavaLevel: number;
  lavaColor: string;
  lavaGlowColor: string;
  lavaFlowSpeed: number;
}

export interface StructuresDNA {
  density: number; // 0.0 - 2.0
  type: 'none' | 'trees' | 'bamboo' | 'crystals' | 'skyscrapers' | 'floating-islands' | 'fractals' | 'portals' | 'organic-cells';
  color: string;
  secondaryColor: string;
  neonGlowColor: string;
  scale: number;
  animated: boolean;
}

export interface PhysicsDNA {
  gravity: number; // -9.8 to 20.0
  eventFrequency: number; // 0.1 - 2.0
  interactionStrength: number; // 0.1 - 3.0
  motionParallaxMultiplier: number; // 0.2 - 3.0
}

export interface EnvironmentDNA {
  id: string;
  name: string;
  category: BiomeCategory;
  biome: BiomeType;
  seed: number;
  description: string;

  timeOfDay: TimeOfDay;
  timeCycleSpeed: number; // 0 = static, 0.05 = slow real-time cycle

  terrain: TerrainDNA;
  atmosphere: AtmosphereDNA;
  weather: WeatherDNA;
  liquid: LiquidDNA;
  structures: StructuresDNA;
  physics: PhysicsDNA;

  camera: {
    behavior: CameraBehavior;
    distance: number;
    height: number;
    fov: number;
  };

  accentColor: string;
}

export interface EnvironmentPreset {
  id: string;
  title: string;
  category: BiomeCategory;
  biome: BiomeType;
  tags: string[];
  dna: EnvironmentDNA;
}
