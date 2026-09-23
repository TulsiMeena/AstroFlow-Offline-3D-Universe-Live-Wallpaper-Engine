import {
  FusionDNA,
  FusionSystemType
} from '../types/infiniteTypes';
import { BiomeType, WeatherType } from '../../environment/types/environmentDNA';
import { LifeEntityType } from '../../living/EcosystemDNA';

export class FusionDNAFactory {
  /**
   * Translates a FusionSystemType to a matching BiomeType for environmental subsystems
   */
  public static mapSystemToBiome(system: FusionSystemType): BiomeType {
    switch (system) {
      case 'forest':
        return 'living-forest';
      case 'ocean':
      case 'underwater':
        return 'ocean-world';
      case 'cyber-city':
        return 'cyber-city';
      case 'volcano':
        return 'volcano-world';
      case 'crystal':
        return 'crystal-world';
      case 'aurora':
      case 'galaxy':
      case 'space':
      case 'black-hole':
        return 'aurora-world';
      case 'snow':
      case 'mountain':
        return 'snow-world';
      case 'rain':
        return 'rain-world';
      case 'lightning':
        return 'lightning-world';
      case 'energy':
        return 'energy-world';
      case 'portal':
        return 'portal-world';
      case 'planet':
      case 'alien-planet':
        return 'space-city';
      case 'bioluminescence':
        return 'crystal-world';
      case 'floating-islands':
      case 'fantasy':
      case 'desert':
      default:
        return 'floating-islands';
    }
  }

  /**
   * Deterministic weather selection based on blended systems
   */
  public static deriveWeather(
    primary: FusionSystemType,
    secondary: FusionSystemType,
    amount: number
  ): WeatherType {
    if (primary === 'cyber-city' && secondary === 'volcano') return 'embers';
    if (secondary === 'aurora' || primary === 'aurora') return 'aurora';
    if (primary === 'snow' || secondary === 'snow' || primary === 'mountain') return 'snow';
    if (primary === 'cyber-city' || secondary === 'cyber-city') {
      return amount > 0.5 ? 'storm' : 'rain';
    }
    if (primary === 'volcano' || secondary === 'volcano') return 'embers';
    if (primary === 'rain' || secondary === 'rain') return 'rain';
    if (primary === 'lightning' || secondary === 'lightning') return 'storm';
    if (primary === 'space' || primary === 'galaxy' || secondary === 'black-hole') return 'cyber-dust';
    if (primary === 'ocean' || secondary === 'ocean') return 'rain';
    return 'clear';
  }

  /**
   * Deterministic lifeform derivation for fused ecosystems
   */
  public static deriveAllowedEntities(
    primary: FusionSystemType,
    secondary: FusionSystemType
  ): LifeEntityType[] {
    const list: LifeEntityType[] = [];

    // Primary system entities
    if (primary === 'forest' || secondary === 'forest') {
      list.push('birds', 'butterflies', 'fireflies', 'leaves');
    }
    if (primary === 'ocean' || secondary === 'ocean' || primary === 'underwater' || secondary === 'underwater') {
      list.push('fish', 'underwater-creatures');
    }
    if (primary === 'cyber-city' || secondary === 'cyber-city') {
      list.push('drones');
    }
    if (primary === 'volcano' || secondary === 'volcano') {
      list.push('volcanic-embers');
    }
    if (primary === 'crystal' || secondary === 'crystal' || primary === 'fantasy' || secondary === 'fantasy') {
      list.push('fireflies', 'drifting-spores');
    }
    if (primary === 'galaxy' || secondary === 'galaxy' || primary === 'space' || secondary === 'space') {
      list.push('drones', 'drifting-spores');
    }

    if (list.length === 0) {
      list.push('fireflies', 'clouds', 'drifting-spores');
    }

    // Deduplicate
    return Array.from(new Set(list));
  }

  /**
   * Color generation deterministic mapping
   */
  public static getSystemColors(system: FusionSystemType): {
    primary: string;
    secondary: string;
    accent: string;
  } {
    switch (system) {
      case 'galaxy':
        return { primary: '#0a0a2a', secondary: '#7000FF', accent: '#00F0FF' };
      case 'black-hole':
        return { primary: '#030308', secondary: '#FF3300', accent: '#FFD700' };
      case 'forest':
        return { primary: '#052210', secondary: '#00FFA3', accent: '#AAFF00' };
      case 'ocean':
        return { primary: '#031B33', secondary: '#00D4FF', accent: '#00FFA3' };
      case 'cyber-city':
        return { primary: '#0A0618', secondary: '#FF007F', accent: '#00F0FF' };
      case 'volcano':
        return { primary: '#1F0606', secondary: '#FF3300', accent: '#FFAA00' };
      case 'crystal':
        return { primary: '#0E182B', secondary: '#00F0FF', accent: '#D680FF' };
      case 'aurora':
        return { primary: '#04151F', secondary: '#00FFA3', accent: '#B300FF' };
      case 'mountain':
        return { primary: '#12151D', secondary: '#88AACC', accent: '#00F0FF' };
      case 'snow':
        return { primary: '#101624', secondary: '#DDEEFF', accent: '#88DDFF' };
      case 'desert':
        return { primary: '#241407', secondary: '#FF9900', accent: '#FFCC66' };
      case 'space':
        return { primary: '#020208', secondary: '#442288', accent: '#00FFFF' };
      case 'floating-islands':
        return { primary: '#081822', secondary: '#00FFCC', accent: '#FF88DD' };
      case 'fantasy':
        return { primary: '#140826', secondary: '#D946EF', accent: '#00FFA3' };
      case 'underwater':
        return { primary: '#02182B', secondary: '#00E5FF', accent: '#00FF88' };
      case 'rain':
        return { primary: '#0A1525', secondary: '#4A90E2', accent: '#70D6FF' };
      case 'lightning':
        return { primary: '#100A25', secondary: '#8A2BE2', accent: '#00FFFF' };
      case 'energy':
        return { primary: '#051825', secondary: '#00F0FF', accent: '#39FF14' };
      case 'portal':
        return { primary: '#1A0525', secondary: '#D946EF', accent: '#00F0FF' };
      case 'planet':
      case 'alien-planet':
        return { primary: '#150820', secondary: '#FF007F', accent: '#00FFA3' };
      case 'bioluminescence':
        return { primary: '#02151B', secondary: '#00FFCC', accent: '#FFD700' };
    }
  }

  /**
   * Creates a deterministic FusionDNA based on primary and secondary systems
   */
  public static createDefault(
    primary: FusionSystemType = 'ocean',
    secondary: FusionSystemType = 'aurora',
    baseSeed: number = 777,
    fusionAmount: number = 0.5
  ): FusionDNA {
    const colA = this.getSystemColors(primary);
    const colB = this.getSystemColors(secondary);

    const name = `${this.formatSystemName(primary)} × ${this.formatSystemName(secondary)}`;
    const id = `fusion-${primary}-${secondary}-${baseSeed}`;

    return {
      id,
      name,
      description: `Procedural fusion of ${this.formatSystemName(primary)} and ${this.formatSystemName(secondary)} with hybrid terrain, dynamic weather, and multi-biome lifeforms.`,
      baseWorldSeed: baseSeed,
      secondaryWorldSeed: (baseSeed * 1664525 + 1013904223) >>> 0,
      environmentSeed: (baseSeed ^ 0x5a5a5a) >>> 0,
      ecosystemSeed: (baseSeed ^ 0xa5a5a5) >>> 0,
      primarySystem: primary,
      secondarySystem: secondary,
      fusionAmount: Math.min(Math.max(fusionAmount, 0), 1),
      terrainBlend: 0.5,
      atmosphereBlend: 0.5,
      weatherBlend: 0.5,
      lightingBlend: 0.5,
      particleBlend: 0.5,
      physicsBlend: 0.5,
      ecosystemBlend: 0.5,
      eventBlend: 0.5,
      weatherType: this.deriveWeather(primary, secondary, fusionAmount),
      primaryBiome: this.mapSystemToBiome(primary),
      secondaryBiome: this.mapSystemToBiome(secondary),
      allowedEntities: this.deriveAllowedEntities(primary, secondary),
      gravity: 9.8 * (primary === 'space' || secondary === 'space' ? 0.35 : 1.0),
      atmosphereFogDensity: 0.008,
      primaryColor: colA.primary,
      secondaryColor: colB.secondary,
      accentColor: colB.accent,
      tags: [primary, secondary, 'fusion', 'infinite-world', 'procedural'],
      createdAt: Date.now()
    };
  }

  public static formatSystemName(system: FusionSystemType): string {
    return system
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  /**
   * Curated high-aesthetic presets required by user
   */
  public static getCuratedPresets(): FusionDNA[] {
    return [
      {
        ...this.createDefault('ocean', 'aurora', 101, 0.5),
        id: 'preset-ocean-aurora',
        name: 'Ocean + Aurora',
        description: 'Bioluminescent deep ocean waters beneath shifting emerald atmospheric auroras.'
      },
      {
        ...this.createDefault('galaxy', 'black-hole', 202, 0.65),
        id: 'preset-galaxy-blackhole',
        name: 'Galaxy + Black Hole',
        description: 'Colossal spiral galaxy arms pulled into a relativistic singularity accretion vortex.'
      },
      {
        ...this.createDefault('forest', 'aurora', 303, 0.45),
        id: 'preset-forest-aurora',
        name: 'Forest + Aurora',
        description: 'Ancient whispering canopy crowned by celestial dancing polar electromagnetic waves.'
      },
      {
        ...this.createDefault('forest', 'rain', 404, 0.5),
        id: 'preset-forest-rain',
        name: 'Forest + Rain',
        description: 'Damp primordial foliage with steady raindrops, soft mist, and drifting spore clouds.'
      },
      {
        ...this.createDefault('mountain', 'snow', 505, 0.55),
        id: 'preset-mountain-snow',
        name: 'Mountain + Snow',
        description: 'Jagged crystalline mountain peaks engulfed in swirling blizzard snowdrifts.'
      },
      {
        ...this.createDefault('volcano', 'snow', 606, 0.5),
        id: 'preset-volcano-snow',
        name: 'Volcano + Snow',
        description: 'Surreal juxtaposition of molten lava ridges fracturing against sub-zero glacial ice sheets.'
      },
      {
        ...this.createDefault('cyber-city', 'rain', 707, 0.4),
        id: 'preset-cyber-rain',
        name: 'Cyber City + Rain',
        description: 'Neon metropolis skyscrapers reflecting neon light pools across rain-slicked cyberways.'
      },
      {
        ...this.createDefault('cyber-city', 'aurora', 808, 0.6),
        id: 'preset-cyber-lightning',
        name: 'Cyber City + Lightning',
        description: 'High-voltage electric discharge cascades cracking over mega-structure cyber towers.'
      },
      {
        ...this.createDefault('crystal', 'floating-islands', 909, 0.5),
        id: 'preset-crystal-energy',
        name: 'Crystal + Energy',
        description: 'Harmonically resonating quartz monoliths radiating pulsed holographic energy grids.'
      },
      {
        ...this.createDefault('desert', 'black-hole', 1010, 0.5),
        id: 'preset-desert-portal',
        name: 'Desert + Portal',
        description: 'Dune sands whispering around an ancient stargate portal bending space-time.'
      },
      {
        ...this.createDefault('ocean', 'space', 1111, 0.5),
        id: 'preset-ocean-space',
        name: 'Ocean + Space',
        description: 'Weightless floating aquatic spheres with schooling fish swimming into stellar starfields.'
      },
      {
        ...this.createDefault('floating-islands', 'cyber-city', 1212, 0.5),
        id: 'preset-planet-cybercity',
        name: 'Planet + Cyber City',
        description: 'Orbital celestial ring-city with floating cyber platforms and autonomous cargo craft.'
      },
      {
        ...this.createDefault('fantasy', 'galaxy', 1313, 0.5),
        id: 'preset-fantasy-galaxy',
        name: 'Fantasy + Galaxy',
        description: 'Mythical floating castles surrounded by shimmering nebulae and interstellar dust trails.'
      },
      {
        ...this.createDefault('underwater', 'crystal', 1414, 0.5),
        id: 'preset-underwater-bioluminescence',
        name: 'Underwater + Bioluminescence',
        description: 'Deep abyssal coral spires blooming with radiant neon pulses and luminous organisms.'
      },
      {
        ...this.createDefault('volcano', 'space', 1515, 0.6),
        id: 'preset-volcano-alienplanet',
        name: 'Volcano + Alien Planet',
        description: 'Alien exoplanet terrain blasted by geothermal pyroclastic flows and cosmic radiation.'
      }
    ];
  }

  /**
   * Deterministically randomize a new fusion world
   */
  public static createRandom(seed: number = Math.floor(Math.random() * 999999)): FusionDNA {
    const systems: FusionSystemType[] = [
      'galaxy',
      'black-hole',
      'forest',
      'ocean',
      'cyber-city',
      'volcano',
      'crystal',
      'aurora',
      'mountain',
      'snow',
      'desert',
      'space',
      'floating-islands',
      'fantasy',
      'underwater'
    ];

    const idxA = Math.abs(seed) % systems.length;
    let idxB = Math.abs((seed * 31 + 17) >>> 0) % systems.length;
    if (idxA === idxB) {
      idxB = (idxB + 1) % systems.length;
    }

    const primary = systems[idxA];
    const secondary = systems[idxB];
    const amount = 0.3 + (((seed * 7) % 50) / 100);

    return this.createDefault(primary, secondary, seed, amount);
  }
}
