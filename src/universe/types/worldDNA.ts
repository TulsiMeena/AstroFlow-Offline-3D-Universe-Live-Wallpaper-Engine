export type GalaxyMorphology = 'spiral' | 'barred-spiral' | 'elliptical' | 'irregular';

export type PlanetType = 'rocky' | 'gas-giant' | 'ice' | 'lava' | 'ocean' | 'alien';

export interface NebulaColorConfig {
  primary: string;    // Hex color (e.g., #00F0FF)
  secondary: string;  // Hex color (e.g., #7000FF)
  accent: string;     // Hex color (e.g., #FF007F)
  blend: number;      // 0.0 to 1.0 color diffusion
}

export interface WorldDNA {
  seed: string;
  universeSize: number;           // 50 to 400
  starDensity: number;            // 0.2 to 2.0
  starBrightness: number;         // 0.3 to 2.0
  galaxyCount: number;            // 1 to 6
  galaxyType: GalaxyMorphology;
  galaxyRotation: number;         // 0.2 to 2.5
  nebulaDensity: number;          // 0.0 to 2.0
  nebulaColor: NebulaColorConfig;
  planetCount: number;            // 1 to 9
  planetSizeRange: [number, number]; // [minRadius, maxRadius]
  orbitSpeed: number;             // 0.2 to 2.5
  gravityStrength: number;        // 0.1 to 4.0
  particleDensity: number;        // 0.2 to 2.5
  particleSpeed: number;          // 0.2 to 2.5
  turbulence: number;             // 0.0 to 2.0
  atmosphereDensity: number;      // 0.2 to 2.0
  bloomStrength: number;          // 0.0 to 2.0
  cameraDepth: number;            // 20 to 100
  timeScale: number;              // 0.2 to 2.5
  eventFrequency: number;         // 0.1 to 2.0
}

export interface UniversePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  dna: WorldDNA;
}

export interface SavedUniverse {
  id: string;
  name: string;
  seed: string;
  createdAt: number;
  dna: WorldDNA;
  notes?: string;
}
