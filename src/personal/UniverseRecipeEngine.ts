import {
  WorldType,
  WorldStyle,
  WorldAtmosphere,
  WorldMotion,
  WorldPerformance,
  UniverseRecipe
} from './types';
import { StyleGenerator } from './StyleGenerator';
import { ProceduralPromptInterpreter } from './ProceduralPromptInterpreter';
import { ProceduralDesignBrain } from './ProceduralDesignBrain';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { BatteryImpactEstimator } from '../power/BatteryImpactEstimator';
import { QualityProfile } from '../types/engine';

export class UniverseRecipeEngine {
  /**
   * Deterministically converts any alphanumeric string seed (e.g. "AMIT-001") into an integer seed.
   */
  public static hashSeedToNumber(seed: string): number {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  /**
   * Generates a random human-friendly seed if none provided.
   */
  public static generateSeedString(): string {
    const prefixes = ['AMIT', 'COSMOS', 'CHRONO', 'NEO', 'AETHER', 'HYPER', 'SOLAR', 'VORTEX', 'STELLAR', 'ZEN'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${num}`;
  }

  /**
   * Builds a complete, deterministic, offline UniverseRecipe.
   */
  public static createRecipe(options: {
    worldType: WorldType;
    style: WorldStyle;
    atmosphere: WorldAtmosphere;
    motion: WorldMotion;
    performance: WorldPerformance;
    seed?: string;
    customPrompt?: string;
    name?: string;
  }): UniverseRecipe {
    const seed = (options.seed && options.seed.trim()) ? options.seed.trim() : this.generateSeedString();
    const numericSeed = this.hashSeedToNumber(seed);
    const rng = new SeededRNG(seed);

    // 1. Interpret optional text prompt locally (100% offline, ignores unrecognized tokens)
    const directives = ProceduralPromptInterpreter.interpret(options.customPrompt || '');

    // 2. Generate aesthetic colors & materials for selected style & atmosphere
    const aesthetics = StyleGenerator.getAesthetics(options.style, options.atmosphere, directives.colorBiases);

    // 3. Brain resolves world parameters, biomes, weather, lighting, physics, ecosystem
    const brain = ProceduralDesignBrain.evaluate(
      options.worldType,
      options.atmosphere,
      options.motion,
      options.performance,
      aesthetics,
      directives,
      rng
    );

    // 4. Estimate battery & performance load based on active elements
    const particleScore = Math.min(100, Math.round((brain.particleCount / 3000) * 45));
    const bloomScore = Math.min(100, Math.round(aesthetics.bloom * 35));
    const motionScore = options.motion === 'DYNAMIC' ? 40 : options.motion === 'BALANCED' ? 25 : options.motion === 'SUBTLE' ? 15 : 0;
    const perfScore = options.performance === 'ULTRA' ? 35 : options.performance === 'HIGH QUALITY' ? 25 : options.performance === 'BALANCED' ? 15 : 5;
    const compositeScore = Math.min(100, Math.round(particleScore * 0.35 + bloomScore * 0.25 + motionScore * 0.2 + perfScore * 0.2));

    const impact: 'LOW' | 'MEDIUM' | 'HIGH' = compositeScore < 35 ? 'LOW' : compositeScore < 68 ? 'MEDIUM' : 'HIGH';
    const performanceLoad: 'LOW' | 'MEDIUM' | 'HIGH' = impact;
    const recommendedQuality: QualityProfile = impact === 'HIGH' ? 'LOW' : impact === 'MEDIUM' ? 'MEDIUM' : 'HIGH';

    const batteryMetrics = {
      impact,
      performanceLoad,
      recommendedQuality
    };

    const recipeName = options.name || `${brain.effectiveWorldType} ${options.style} [${seed}]`;

    return {
      id: `recipe_${numericSeed}_${Date.now()}`,
      name: recipeName,
      seed,
      numericSeed,
      worldType: brain.effectiveWorldType,
      style: options.style,
      atmosphere: options.atmosphere,
      motion: options.motion,
      performance: options.performance,
      customPrompt: options.customPrompt,

      environment: {
        biome: brain.biome,
        terrainType: brain.terrainType,
        liquidType: brain.liquidType,
        structureType: brain.structureType
      },

      weather: {
        type: brain.weatherType,
        intensity: brain.weatherIntensity,
        windSpeed: brain.windSpeed,
        cloudDensity: brain.cloudDensity
      },

      time: {
        timeOfDay: brain.timeOfDay,
        timeCycleSpeed: brain.timeCycleSpeed
      },

      lighting: {
        sunIntensity: brain.sunIntensity,
        ambientIntensity: brain.ambientIntensity,
        sunColor: aesthetics.primaryColor,
        emissiveColor: aesthetics.glowColor,
        hasAurora: brain.hasAurora,
        hasStars: brain.hasStars,
        starDensity: brain.starDensity
      },

      particles: {
        count: brain.particleCount,
        speed: brain.particleSpeed,
        size: brain.particleSize,
        color: aesthetics.primaryColor,
        turbulence: brain.particleTurbulence,
        type: brain.particleType
      },

      physics: {
        gravity: brain.gravity,
        turbulence: brain.physicsTurbulence,
        interactionStrength: brain.interactionStrength,
        vortexStrength: brain.vortexStrength
      },

      ecosystem: {
        enabled: brain.ecosystemEnabled,
        density: brain.ecosystemDensity,
        activity: brain.ecosystemActivity,
        entities: brain.ecosystemEntities
      },

      camera: {
        fov: brain.cameraFov,
        distance: brain.cameraDistance,
        driftSpeed: brain.cameraDrift,
        orbitSpeed: brain.cameraOrbit,
        behavior: brain.cameraBehavior
      },

      motionProfile: {
        sensitivity: brain.motionSensitivity,
        touchInteraction: brain.touchInteraction,
        parallaxMultiplier: brain.parallaxMultiplier
      },

      audio: {
        enabled: brain.audioEnabled,
        sensitivity: brain.audioSensitivity,
        reactiveMode: brain.audioReactiveMode
      },

      effects: {
        bloom: aesthetics.bloom,
        fog: aesthetics.fog,
        atmosphereScale: aesthetics.atmosphereScale,
        postProcessing: aesthetics.postProcessing,
        amoledBlack: aesthetics.amoledBlack
      },

      colors: {
        primary: aesthetics.primaryColor,
        secondary: aesthetics.secondaryColor,
        accent: aesthetics.accentColor,
        glow: aesthetics.glowColor,
        background: aesthetics.backgroundColor
      },

      materials: {
        type: aesthetics.materialType,
        roughness: aesthetics.roughness,
        metalness: aesthetics.metalness,
        transmission: aesthetics.transmission,
        emissiveIntensity: aesthetics.emissiveIntensity
      },

      batteryAssessment: {
        impact: batteryMetrics.impact,
        performanceLoad: batteryMetrics.performanceLoad,
        recommendedQuality: batteryMetrics.recommendedQuality
      },

      createdAt: Date.now()
    };
  }
}
