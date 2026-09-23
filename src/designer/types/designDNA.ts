export type FusionElement =
  | 'SPACE'
  | 'GALAXY'
  | 'NEBULA'
  | 'BLACK HOLE'
  | 'PLANET'
  | 'OCEAN'
  | 'FOREST'
  | 'MOUNTAIN'
  | 'RAIN'
  | 'SNOW'
  | 'AURORA'
  | 'VOLCANO'
  | 'LAVA'
  | 'CYBER CITY'
  | 'NEON'
  | 'CRYSTAL'
  | 'LIQUID GLASS'
  | 'ENERGY'
  | 'FRACTAL'
  | 'PORTAL'
  | 'LIVING WORLD'
  | 'PARTICLES';

export type LayerType =
  | 'Background'
  | 'Sky'
  | 'Environment'
  | 'Terrain'
  | 'Main Object'
  | 'Particles'
  | 'Atmosphere'
  | 'Lighting'
  | 'Effects'
  | 'Foreground';

export interface LayerConfig {
  enabled: boolean;
  intensity: number;      // 0.0 to 2.0
  scale: number;          // 0.2 to 3.0
  speed: number;          // 0.0 to 3.0
  depth: number;          // -50 to 50
  opacity: number;        // 0.0 to 1.0
  interactionStrength: number; // 0.0 to 2.0
  blendMode?: 'normal' | 'additive' | 'screen';
}

export type MaterialType =
  | 'metal'
  | 'glass-style'
  | 'crystal'
  | 'liquid-style'
  | 'energy'
  | 'lava'
  | 'ice'
  | 'hologram'
  | 'organic'
  | 'cosmic dust';

export interface MaterialConfig {
  type: MaterialType;
  roughness: number;      // 0.0 to 1.0
  metalness: number;      // 0.0 to 1.0
  transmission: number;   // 0.0 to 1.0
  ior: number;            // 1.0 to 2.5
  emissiveIntensity: number; // 0.0 to 3.0
  wireframe: boolean;
  pulseSpeed: number;     // 0.1 to 3.0
  dispersion: number;     // 0.0 to 1.0
  audioReactivity: number;// 0.0 to 2.0
}

export type ColorPreset =
  | 'AMOLED'
  | 'COSMIC'
  | 'NEON'
  | 'OCEAN'
  | 'FOREST'
  | 'FIRE'
  | 'ICE'
  | 'CRYSTAL'
  | 'CYBER'
  | 'FANTASY';

export interface ProceduralColors {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  background: string;
  preset: ColorPreset;
  harmony: 'complementary' | 'triadic' | 'analogous' | 'monochrome';
}

export interface PhysicsDesignConfig {
  particleDensity: number;  // 0.1 to 2.0
  particleSize: number;     // 0.2 to 3.0
  particleSpeed: number;    // 0.1 to 3.0
  gravity: number;          // -2.0 to 2.0
  wind: number;             // -2.0 to 2.0
  turbulence: number;       // 0.0 to 2.0
  vortexStrength: number;   // 0.0 to 3.0
  attraction: number;       // 0.0 to 2.0
  repulsion: number;        // 0.0 to 2.0
  shockwaveActive: boolean;
}

export interface CameraDesignConfig {
  depth: number;            // 5 to 60
  fov: number;              // 30 to 90
  driftSpeed: number;       // 0.0 to 2.0
  orbitSpeed: number;       // 0.0 to 2.0
  distance: number;         // 10 to 80
}

export type MotionMode = 'OFF' | 'Subtle' | 'Balanced' | 'Dynamic';

export interface MotionDesignConfig {
  mode: MotionMode;
  sensitivity: number;      // 0.1 to 3.0
  touchInteraction: boolean;
  touchSensitivity: number; // 0.1 to 3.0
}

export interface AudioDesignConfig {
  enabled: boolean;
  bassToScale: boolean;
  midToMovement: boolean;
  trebleToParticles: boolean;
  beatToShockwave: boolean;
  energyToBloom: boolean;
  sensitivity: number;      // 0.2 to 2.5
}

export type WeatherType =
  | 'clear'
  | 'rain'
  | 'snow'
  | 'fireflies'
  | 'cosmic-aurora'
  | 'meteor-shower';

export type EcosystemType =
  | 'dormant'
  | 'flourishing'
  | 'bioluminescent'
  | 'cybernetic'
  | 'ethereal';

export interface EffectsDesignConfig {
  bloom: number;            // 0.0 to 2.0
  fog: number;              // 0.0 to 1.0
  atmosphere: number;       // 0.0 to 2.0
  worldScale: number;       // 0.5 to 2.5
  animationSpeed: number;   // 0.1 to 3.0
  eventFrequency: number;   // 0.1 to 2.0
  weather: WeatherType;
  ecosystem: EcosystemType;
}

export interface DesignDNA {
  seed: string;
  name: string;
  elements: FusionElement[];
  layers: Record<LayerType, LayerConfig>;
  material: MaterialConfig;
  colors: ProceduralColors;
  physics: PhysicsDesignConfig;
  camera: CameraDesignConfig;
  motion: MotionDesignConfig;
  audio: AudioDesignConfig;
  effects: EffectsDesignConfig;
  estimatedComplexity: number; // 0 to 100
  timestamp: number;
}

export interface SavedCustomWallpaper {
  id: string;
  name: string;
  seed: string;
  dna: DesignDNA;
  createdAt: number;
  previewMetadata: {
    elementsSummary: string;
    dominantColor: string;
    materialType: MaterialType;
  };
  isFavorite: boolean;
}
