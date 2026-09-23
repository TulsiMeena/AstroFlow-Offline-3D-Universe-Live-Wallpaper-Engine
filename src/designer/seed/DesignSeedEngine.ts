import {
  DesignDNA,
  FusionElement,
  LayerConfig,
  LayerType,
  MaterialConfig,
  MaterialType,
  PhysicsDesignConfig,
  CameraDesignConfig,
  MotionDesignConfig,
  AudioDesignConfig,
  EffectsDesignConfig,
  WeatherType,
  EcosystemType,
  ColorPreset
} from '../types/designDNA';
import { ProceduralColorEngine } from '../colors/ProceduralColorEngine';

export class DesignSeedEngine {
  private static readonly ALL_ELEMENTS: FusionElement[] = [
    'SPACE', 'GALAXY', 'NEBULA', 'BLACK HOLE', 'PLANET',
    'OCEAN', 'FOREST', 'MOUNTAIN', 'RAIN', 'SNOW',
    'AURORA', 'VOLCANO', 'LAVA', 'CYBER CITY', 'NEON',
    'CRYSTAL', 'LIQUID GLASS', 'ENERGY', 'FRACTAL', 'PORTAL',
    'LIVING WORLD', 'PARTICLES'
  ];

  private static readonly ALL_MATERIALS: MaterialType[] = [
    'metal', 'glass-style', 'crystal', 'liquid-style', 'energy',
    'lava', 'ice', 'hologram', 'organic', 'cosmic dust'
  ];

  private static readonly ALL_WEATHERS: WeatherType[] = [
    'clear', 'rain', 'snow', 'fireflies', 'cosmic-aurora', 'meteor-shower'
  ];

  private static readonly ALL_ECOSYSTEMS: EcosystemType[] = [
    'dormant', 'flourishing', 'bioluminescent', 'cybernetic', 'ethereal'
  ];

  /**
   * Generates a unique readable random seed string
   */
  public static generateSeed(): string {
    const prefixes = ['HYPER', 'NEO', 'ASTRAL', 'QUANTUM', 'CHRONO', 'SYNTH', 'SOLAR', 'VORTEX', 'PRISM'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${num}`;
  }

  /**
   * Deterministic PRNG based on string seed (Mulberry32)
   */
  public static getPRNG(seedStr: string): () => number {
    let h = 0xdeadbeef;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 2654435761);
    }
    let s = (h ^ (h >>> 16)) >>> 0;

    return () => {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Creates a complete, deterministic DesignDNA from a seed
   */
  public static createDNAFromSeed(seed: string, baseElements?: FusionElement[]): DesignDNA {
    const prng = this.getPRNG(seed);

    // Pick 2-4 fusion elements if not explicitly supplied
    let chosenElements: FusionElement[];
    if (baseElements && baseElements.length > 0) {
      chosenElements = [...baseElements];
    } else {
      const count = 2 + Math.floor(prng() * 2); // 2 or 3 elements
      const shuffled = [...this.ALL_ELEMENTS].sort(() => prng() - 0.5);
      chosenElements = shuffled.slice(0, count);
    }

    // Material
    const materialType = this.ALL_MATERIALS[Math.floor(prng() * this.ALL_MATERIALS.length)];
    const material: MaterialConfig = {
      type: materialType,
      roughness: 0.1 + prng() * 0.5,
      metalness: 0.2 + prng() * 0.7,
      transmission: materialType === 'glass-style' || materialType === 'crystal' || materialType === 'liquid-style' ? 0.85 : 0.0,
      ior: 1.33 + prng() * 0.9,
      emissiveIntensity: 0.8 + prng() * 1.5,
      wireframe: prng() > 0.85,
      pulseSpeed: 0.8 + prng() * 1.2,
      dispersion: prng() * 0.5,
      audioReactivity: 0.7 + prng() * 0.6,
    };

    // Colors
    const seedInt = Math.floor(prng() * 100000);
    const colors = ProceduralColorEngine.generateHarmoniousColors(seedInt);

    // Layers config
    const layers: Record<LayerType, LayerConfig> = {
      Background: {
        enabled: true,
        intensity: 0.9 + prng() * 0.3,
        scale: 1.0,
        speed: 0.4 + prng() * 0.6,
        depth: -30,
        opacity: 1.0,
        interactionStrength: 0.5,
      },
      Sky: {
        enabled: chosenElements.some(e => ['AURORA', 'NEBULA', 'GALAXY', 'SPACE', 'SNOW'].includes(e)) || prng() > 0.2,
        intensity: 0.8 + prng() * 0.5,
        scale: 1.0 + prng() * 0.5,
        speed: 0.5 + prng() * 0.8,
        depth: -20,
        opacity: 0.85,
        interactionStrength: 0.8,
      },
      Environment: {
        enabled: chosenElements.some(e => ['CYBER CITY', 'FOREST', 'MOUNTAIN', 'VOLCANO', 'CRYSTAL', 'PLANET'].includes(e)) || prng() > 0.3,
        intensity: 1.0,
        scale: 1.0,
        speed: 0.6 + prng() * 0.6,
        depth: -10,
        opacity: 0.9,
        interactionStrength: 1.0,
      },
      Terrain: {
        enabled: chosenElements.some(e => ['OCEAN', 'LAVA', 'CYBER CITY', 'FRACTAL', 'FOREST'].includes(e)) || prng() > 0.3,
        intensity: 1.0,
        scale: 1.0,
        speed: 0.8 + prng() * 0.6,
        depth: -5,
        opacity: 0.95,
        interactionStrength: 1.2,
      },
      'Main Object': {
        enabled: true,
        intensity: 1.2,
        scale: 1.0 + prng() * 0.4,
        speed: 0.8 + prng() * 0.5,
        depth: 0,
        opacity: 1.0,
        interactionStrength: 1.5,
      },
      Particles: {
        enabled: true,
        intensity: 1.0,
        scale: 1.0,
        speed: 0.8 + prng() * 0.7,
        depth: 5,
        opacity: 0.85,
        interactionStrength: 1.4,
      },
      Atmosphere: {
        enabled: prng() > 0.2,
        intensity: 0.7 + prng() * 0.5,
        scale: 1.0,
        speed: 0.3,
        depth: 10,
        opacity: 0.65,
        interactionStrength: 0.3,
      },
      Lighting: {
        enabled: true,
        intensity: 1.1 + prng() * 0.4,
        scale: 1.0,
        speed: 1.0,
        depth: 0,
        opacity: 1.0,
        interactionStrength: 1.0,
      },
      Effects: {
        enabled: true,
        intensity: 1.0,
        scale: 1.0,
        speed: 1.0,
        depth: 0,
        opacity: 1.0,
        interactionStrength: 1.0,
      },
      Foreground: {
        enabled: prng() > 0.35,
        intensity: 0.75 + prng() * 0.4,
        scale: 0.8 + prng() * 0.5,
        speed: 0.9 + prng() * 0.5,
        depth: 15,
        opacity: 0.75,
        interactionStrength: 1.2,
      }
    };

    // Physics
    const physics: PhysicsDesignConfig = {
      particleDensity: 0.8 + prng() * 0.6,
      particleSize: 0.8 + prng() * 0.8,
      particleSpeed: 0.8 + prng() * 0.8,
      gravity: (prng() - 0.5) * 1.5,
      wind: (prng() - 0.5) * 1.5,
      turbulence: 0.5 + prng() * 0.8,
      vortexStrength: prng() > 0.4 ? 0.8 + prng() * 1.2 : 0,
      attraction: 0.6 + prng() * 0.6,
      repulsion: 0.4 + prng() * 0.4,
      shockwaveActive: false,
    };

    // Camera
    const camera: CameraDesignConfig = {
      depth: 25 + prng() * 15,
      fov: 50 + prng() * 20,
      driftSpeed: 0.4 + prng() * 0.6,
      orbitSpeed: 0.3 + prng() * 0.5,
      distance: 28 + prng() * 12,
    };

    // Motion
    const motion: MotionDesignConfig = {
      mode: 'Balanced',
      sensitivity: 1.0 + prng() * 0.4,
      touchInteraction: true,
      touchSensitivity: 1.0,
    };

    // Audio
    const audio: AudioDesignConfig = {
      enabled: true,
      bassToScale: true,
      midToMovement: true,
      trebleToParticles: true,
      beatToShockwave: true,
      energyToBloom: true,
      sensitivity: 1.0,
    };

    // Effects
    const weather = this.ALL_WEATHERS[Math.floor(prng() * this.ALL_WEATHERS.length)];
    const ecosystem = this.ALL_ECOSYSTEMS[Math.floor(prng() * this.ALL_ECOSYSTEMS.length)];
    const effects: EffectsDesignConfig = {
      bloom: 0.8 + prng() * 0.6,
      fog: 0.2 + prng() * 0.4,
      atmosphere: 0.7 + prng() * 0.5,
      worldScale: 1.0,
      animationSpeed: 1.0,
      eventFrequency: 0.8 + prng() * 0.6,
      weather,
      ecosystem,
    };

    const dna: DesignDNA = {
      seed,
      name: `${chosenElements.join(' + ')}`,
      elements: chosenElements,
      layers,
      material,
      colors,
      physics,
      camera,
      motion,
      audio,
      effects,
      estimatedComplexity: 50,
      timestamp: Date.now(),
    };

    dna.estimatedComplexity = this.estimateComplexity(dna);
    return dna;
  }

  /**
   * Randomize only colors, keeping layers/world intact
   */
  public static randomizeColors(currentDNA: DesignDNA, customSeed?: string): DesignDNA {
    const seed = customSeed || this.generateSeed();
    const prng = this.getPRNG(seed);
    const seedInt = Math.floor(prng() * 100000);
    const newColors = ProceduralColorEngine.generateHarmoniousColors(seedInt);

    return {
      ...currentDNA,
      colors: newColors,
      timestamp: Date.now()
    };
  }

  /**
   * Randomize only effects & atmosphere
   */
  public static randomizeEffects(currentDNA: DesignDNA, customSeed?: string): DesignDNA {
    const seed = customSeed || this.generateSeed();
    const prng = this.getPRNG(seed);
    const weather = this.ALL_WEATHERS[Math.floor(prng() * this.ALL_WEATHERS.length)];
    const ecosystem = this.ALL_ECOSYSTEMS[Math.floor(prng() * this.ALL_ECOSYSTEMS.length)];

    return {
      ...currentDNA,
      effects: {
        ...currentDNA.effects,
        bloom: 0.6 + prng() * 0.9,
        fog: 0.15 + prng() * 0.5,
        atmosphere: 0.5 + prng() * 0.8,
        eventFrequency: 0.6 + prng() * 0.8,
        weather,
        ecosystem,
      },
      timestamp: Date.now()
    };
  }

  /**
   * Randomize world elements & materials
   */
  public static randomizeWorld(currentDNA: DesignDNA, customSeed?: string): DesignDNA {
    const seed = customSeed || this.generateSeed();
    const prng = this.getPRNG(seed);
    const count = 2 + Math.floor(prng() * 2);
    const shuffled = [...this.ALL_ELEMENTS].sort(() => prng() - 0.5);
    const newElements = shuffled.slice(0, count);

    const materialType = this.ALL_MATERIALS[Math.floor(prng() * this.ALL_MATERIALS.length)];
    const newMaterial: MaterialConfig = {
      ...currentDNA.material,
      type: materialType,
      roughness: 0.1 + prng() * 0.6,
      metalness: 0.2 + prng() * 0.7,
      emissiveIntensity: 0.8 + prng() * 1.5,
    };

    const updatedDNA: DesignDNA = {
      ...currentDNA,
      name: `${newElements.join(' + ')}`,
      elements: newElements,
      material: newMaterial,
      timestamp: Date.now()
    };

    updatedDNA.estimatedComplexity = this.estimateComplexity(updatedDNA);
    return updatedDNA;
  }

  /**
   * Randomize camera depth and drift
   */
  public static randomizeCamera(currentDNA: DesignDNA, customSeed?: string): DesignDNA {
    const seed = customSeed || this.generateSeed();
    const prng = this.getPRNG(seed);

    return {
      ...currentDNA,
      camera: {
        depth: 20 + prng() * 25,
        fov: 45 + prng() * 25,
        driftSpeed: 0.3 + prng() * 0.8,
        orbitSpeed: 0.2 + prng() * 0.6,
        distance: 25 + prng() * 15,
      },
      timestamp: Date.now()
    };
  }

  /**
   * Computes an estimated performance complexity score (0 to 100)
   */
  public static estimateComplexity(dna: DesignDNA): number {
    let score = 20;

    // Number of active elements
    score += (dna.elements.length || 2) * 5;

    // Enabled layers
    const enabledLayersCount = Object.values(dna.layers).filter(l => l.enabled).length;
    score += enabledLayersCount * 3.5;

    // Particles density
    score += (dna.physics.particleDensity || 1.0) * 15;

    // Material transmission / shader complexity
    if (dna.material.type === 'glass-style' || dna.material.type === 'crystal') {
      score += 10;
    } else if (dna.material.type === 'lava' || dna.material.type === 'energy' || dna.material.type === 'hologram') {
      score += 8;
    }

    // Bloom & effects
    score += (dna.effects.bloom || 0.8) * 5;
    score += (dna.effects.fog || 0.3) * 5;

    return Math.min(100, Math.round(score));
  }

  /**
   * Sanitizes and bounds all DNA properties
   */
  public static sanitizeDNA(dna: DesignDNA): DesignDNA {
    return {
      ...dna,
      estimatedComplexity: this.estimateComplexity(dna),
    };
  }
}
