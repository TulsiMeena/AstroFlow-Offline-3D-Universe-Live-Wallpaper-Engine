import { WorldDNA, UniversePreset, GalaxyMorphology, NebulaColorConfig } from '../types/worldDNA';
import { SeededRNG } from './SeededRNG';

const PREFIXES = ['COSMOS', 'ORION', 'ANDROMEDA', 'CYBER', 'HYPER', 'QUANTUM', 'NEBULA', 'ASTRAL', 'VOID', 'STELLAR'];
const SUFFIXES = ['PRIME', 'NOVA', 'VORTEX', 'PULSAR', 'ECHO', 'CORE', 'HORIZON', 'ABYSS', 'GENESIS', 'DRIFT'];

const NEBULA_PALETTES: NebulaColorConfig[] = [
  { primary: '#00F0FF', secondary: '#7000FF', accent: '#FF007F', blend: 0.65 },
  { primary: '#00FFA3', secondary: '#0066FF', accent: '#B000FF', blend: 0.7 },
  { primary: '#FF3366', secondary: '#FF8800', accent: '#FFD700', blend: 0.6 },
  { primary: '#9D00FF', secondary: '#00D4FF', accent: '#FFFFFF', blend: 0.75 },
  { primary: '#00FFE0', secondary: '#05052A', accent: '#FF00A0', blend: 0.8 },
  { primary: '#FF5E00', secondary: '#7300FF', accent: '#00FFFF', blend: 0.6 }
];

export class UniverseSeedEngine {
  /**
   * Generates a human-friendly alphanumeric seed string (e.g., ORION-7492-NOVA).
   */
  public static generateSeed(): string {
    const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
    const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${num}-${suffix}`;
  }

  /**
   * Derives a complete, deterministic WorldDNA configuration from any string or numeric seed.
   */
  public static createDNAFromSeed(seed: string): WorldDNA {
    const rng = new SeededRNG(seed);

    const galaxyTypes: GalaxyMorphology[] = ['spiral', 'barred-spiral', 'elliptical', 'irregular'];
    const galaxyType = rng.choice(galaxyTypes);
    const nebulaColor = rng.choice(NEBULA_PALETTES);

    const minPlanetSize = Number(rng.range(0.35, 0.7).toFixed(2));
    const maxPlanetSize = Number(rng.range(1.4, 2.8).toFixed(2));

    return {
      seed: seed.trim(),
      universeSize: Math.round(rng.range(100, 300)),
      starDensity: Number(rng.range(0.6, 1.8).toFixed(2)),
      starBrightness: Number(rng.range(0.7, 1.5).toFixed(2)),
      galaxyCount: rng.int(1, 4),
      galaxyType,
      galaxyRotation: Number(rng.range(0.5, 1.8).toFixed(2)),
      nebulaDensity: Number(rng.range(0.5, 1.6).toFixed(2)),
      nebulaColor,
      planetCount: rng.int(3, 7),
      planetSizeRange: [minPlanetSize, maxPlanetSize],
      orbitSpeed: Number(rng.range(0.6, 1.6).toFixed(2)),
      gravityStrength: Number(rng.range(0.8, 2.5).toFixed(2)),
      particleDensity: Number(rng.range(0.8, 1.8).toFixed(2)),
      particleSpeed: Number(rng.range(0.6, 1.6).toFixed(2)),
      turbulence: Number(rng.range(0.4, 1.5).toFixed(2)),
      atmosphereDensity: Number(rng.range(0.7, 1.6).toFixed(2)),
      bloomStrength: Number(rng.range(0.6, 1.4).toFixed(2)),
      cameraDepth: Math.round(rng.range(30, 75)),
      timeScale: Number(rng.range(0.8, 1.4).toFixed(2)),
      eventFrequency: Number(rng.range(0.5, 1.5).toFixed(2))
    };
  }

  /**
   * Clones and guarantees valid ranges for a customized WorldDNA object.
   */
  public static sanitizeDNA(dna: Partial<WorldDNA> & { seed: string }): WorldDNA {
    const fallback = UniverseSeedEngine.createDNAFromSeed(dna.seed);
    return {
      seed: dna.seed,
      universeSize: Math.max(50, Math.min(500, dna.universeSize ?? fallback.universeSize)),
      starDensity: Math.max(0.1, Math.min(3.0, dna.starDensity ?? fallback.starDensity)),
      starBrightness: Math.max(0.2, Math.min(3.0, dna.starBrightness ?? fallback.starBrightness)),
      galaxyCount: Math.max(1, Math.min(8, dna.galaxyCount ?? fallback.galaxyCount)),
      galaxyType: dna.galaxyType ?? fallback.galaxyType,
      galaxyRotation: Math.max(0.1, Math.min(3.0, dna.galaxyRotation ?? fallback.galaxyRotation)),
      nebulaDensity: Math.max(0.0, Math.min(3.0, dna.nebulaDensity ?? fallback.nebulaDensity)),
      nebulaColor: dna.nebulaColor ?? fallback.nebulaColor,
      planetCount: Math.max(1, Math.min(10, dna.planetCount ?? fallback.planetCount)),
      planetSizeRange: dna.planetSizeRange ?? fallback.planetSizeRange,
      orbitSpeed: Math.max(0.1, Math.min(3.0, dna.orbitSpeed ?? fallback.orbitSpeed)),
      gravityStrength: Math.max(0.1, Math.min(5.0, dna.gravityStrength ?? fallback.gravityStrength)),
      particleDensity: Math.max(0.2, Math.min(3.0, dna.particleDensity ?? fallback.particleDensity)),
      particleSpeed: Math.max(0.1, Math.min(3.0, dna.particleSpeed ?? fallback.particleSpeed)),
      turbulence: Math.max(0.0, Math.min(3.0, dna.turbulence ?? fallback.turbulence)),
      atmosphereDensity: Math.max(0.1, Math.min(3.0, dna.atmosphereDensity ?? fallback.atmosphereDensity)),
      bloomStrength: Math.max(0.0, Math.min(3.0, dna.bloomStrength ?? fallback.bloomStrength)),
      cameraDepth: Math.max(15, Math.min(150, dna.cameraDepth ?? fallback.cameraDepth)),
      timeScale: Math.max(0.1, Math.min(3.0, dna.timeScale ?? fallback.timeScale)),
      eventFrequency: Math.max(0.1, Math.min(3.0, dna.eventFrequency ?? fallback.eventFrequency))
    };
  }

  /**
   * Pre-configured handcrafted iconic universe presets.
   */
  public static getPresets(): UniversePreset[] {
    return [
      {
        id: 'andromeda-spiral',
        name: 'Andromeda Spiral',
        description: 'Vast dual-armed majestic spiral galaxy surrounded by deep star clusters and blue hypergiants.',
        icon: 'Galaxy',
        dna: {
          seed: 'ANDROMEDA-7700-SPIRAL',
          universeSize: 240,
          starDensity: 1.4,
          starBrightness: 1.2,
          galaxyCount: 1,
          galaxyType: 'spiral',
          galaxyRotation: 1.0,
          nebulaDensity: 0.9,
          nebulaColor: { primary: '#00F0FF', secondary: '#7000FF', accent: '#FF007F', blend: 0.7 },
          planetCount: 5,
          planetSizeRange: [0.5, 2.2],
          orbitSpeed: 0.9,
          gravityStrength: 1.2,
          particleDensity: 1.5,
          particleSpeed: 1.0,
          turbulence: 0.8,
          atmosphereDensity: 1.1,
          bloomStrength: 1.0,
          cameraDepth: 55,
          timeScale: 1.0,
          eventFrequency: 0.8
        }
      },
      {
        id: 'singularity-void',
        name: 'Singularity Void',
        description: 'Supermassive spinning black hole with a glowing accretion disk and relativistic gravity well.',
        icon: 'Disc',
        dna: {
          seed: 'VOID-9000-SINGULARITY',
          universeSize: 180,
          starDensity: 1.1,
          starBrightness: 0.8,
          galaxyCount: 1,
          galaxyType: 'barred-spiral',
          galaxyRotation: 1.8,
          nebulaDensity: 0.4,
          nebulaColor: { primary: '#FF5E00', secondary: '#7300FF', accent: '#00F0FF', blend: 0.5 },
          planetCount: 2,
          planetSizeRange: [0.6, 1.8],
          orbitSpeed: 1.5,
          gravityStrength: 3.5,
          particleDensity: 1.8,
          particleSpeed: 1.6,
          turbulence: 1.4,
          atmosphereDensity: 0.5,
          bloomStrength: 1.4,
          cameraDepth: 40,
          timeScale: 1.2,
          eventFrequency: 1.2
        }
      },
      {
        id: 'solar-dominion',
        name: 'Solar Dominion',
        description: 'Thriving planetary system with multiple orbiting worlds, moons, and an instanced asteroid belt.',
        icon: 'Sun',
        dna: {
          seed: 'SOLAR-4200-DOMINION',
          universeSize: 200,
          starDensity: 1.2,
          starBrightness: 1.4,
          galaxyCount: 1,
          galaxyType: 'spiral',
          galaxyRotation: 0.8,
          nebulaDensity: 0.6,
          nebulaColor: { primary: '#00FFA3', secondary: '#0066FF', accent: '#FF8800', blend: 0.6 },
          planetCount: 6,
          planetSizeRange: [0.6, 2.5],
          orbitSpeed: 1.1,
          gravityStrength: 1.5,
          particleDensity: 1.0,
          particleSpeed: 0.9,
          turbulence: 0.6,
          atmosphereDensity: 1.3,
          bloomStrength: 1.0,
          cameraDepth: 50,
          timeScale: 1.0,
          eventFrequency: 0.9
        }
      },
      {
        id: 'orion-nursery',
        name: 'Orion Nebula Nursery',
        description: 'Vibrant stellar gas clouds forming newborn protostars across glowing volumetric dust clouds.',
        icon: 'Sparkles',
        dna: {
          seed: 'ORION-5500-NURSERY',
          universeSize: 220,
          starDensity: 1.6,
          starBrightness: 1.5,
          galaxyCount: 2,
          galaxyType: 'irregular',
          galaxyRotation: 0.7,
          nebulaDensity: 1.8,
          nebulaColor: { primary: '#FF3366', secondary: '#9D00FF', accent: '#00FFE0', blend: 0.85 },
          planetCount: 4,
          planetSizeRange: [0.5, 2.0],
          orbitSpeed: 0.8,
          gravityStrength: 1.0,
          particleDensity: 1.6,
          particleSpeed: 0.8,
          turbulence: 1.5,
          atmosphereDensity: 1.4,
          bloomStrength: 1.5,
          cameraDepth: 60,
          timeScale: 0.9,
          eventFrequency: 1.1
        }
      },
      {
        id: 'deep-space-void',
        name: 'Deep Space Boundless',
        description: 'Tranquil infinite cosmic void with multi-depth star layers, shooting stars, and cosmic drift.',
        icon: 'Orbit',
        dna: {
          seed: 'DEEP-1100-BOUNDLESS',
          universeSize: 320,
          starDensity: 1.8,
          starBrightness: 1.3,
          galaxyCount: 3,
          galaxyType: 'elliptical',
          galaxyRotation: 0.5,
          nebulaDensity: 0.5,
          nebulaColor: { primary: '#00D4FF', secondary: '#05052A', accent: '#B000FF', blend: 0.5 },
          planetCount: 3,
          planetSizeRange: [0.7, 2.4],
          orbitSpeed: 0.7,
          gravityStrength: 0.8,
          particleDensity: 1.2,
          particleSpeed: 0.6,
          turbulence: 0.5,
          atmosphereDensity: 0.8,
          bloomStrength: 0.8,
          cameraDepth: 80,
          timeScale: 0.8,
          eventFrequency: 1.5
        }
      }
    ];
  }
}
