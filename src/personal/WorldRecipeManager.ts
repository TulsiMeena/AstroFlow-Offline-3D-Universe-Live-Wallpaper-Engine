import { UniverseRecipe } from './types';
import { WorldDNA } from '../universe/types/worldDNA';
import { EnvironmentDNA, BiomeCategory } from '../environment/types/environmentDNA';
import { EnvironmentDNAFactory } from '../environment/EnvironmentDNA';
import { EcosystemDNA, EcosystemDNAFactory } from '../living/EcosystemDNA';
import { FusionDNA, FusionSystemType } from '../infinite/types/infiniteTypes';
import { DesignDNA, FusionElement, LayerType, LayerConfig } from '../designer/types/designDNA';

/**
 * Converts a structured UniverseRecipe into existing, production-proven DNA models:
 * WorldDNA, EnvironmentDNA, EcosystemDNA, FusionDNA, and DesignDNA.
 * Zero duplicate incompatible data types.
 */
export class WorldRecipeManager {
  /**
   * Translates recipe into WorldDNA (for ProceduralUniverseWallpaper).
   */
  public static toWorldDNA(recipe: UniverseRecipe): WorldDNA {
    const starMultiplier = recipe.performance === 'BATTERY SAVER' ? 0.5 : recipe.performance === 'ULTRA' ? 1.6 : 1.0;
    const galaxyTypes = ['spiral', 'barred-spiral', 'elliptical', 'irregular'] as const;
    const gIndex = recipe.numericSeed % galaxyTypes.length;

    return {
      seed: recipe.seed,
      universeSize: 200,
      starDensity: Number(((recipe.lighting.starDensity / 4000) * starMultiplier).toFixed(2)),
      starBrightness: recipe.style === 'AMOLED' ? 1.5 : 1.0,
      galaxyCount: recipe.worldType === 'SPACE' ? 3 : 1,
      galaxyType: galaxyTypes[gIndex],
      galaxyRotation: recipe.motion === 'STATIC' ? 0 : recipe.motion === 'DYNAMIC' ? 1.8 : 0.9,
      nebulaDensity: recipe.worldType === 'SPACE' ? 1.2 : 0.4,
      nebulaColor: {
        primary: recipe.colors.primary,
        secondary: recipe.colors.secondary,
        accent: recipe.colors.accent,
        blend: 0.7
      },
      planetCount: recipe.worldType === 'SPACE' ? 5 : 2,
      planetSizeRange: [0.5, 2.2],
      orbitSpeed: recipe.motion === 'STATIC' ? 0 : recipe.motion === 'DYNAMIC' ? 1.4 : 0.8,
      gravityStrength: recipe.physics.gravity,
      particleDensity: Number((recipe.particles.count / 2500).toFixed(2)),
      particleSpeed: recipe.particles.speed,
      turbulence: recipe.physics.turbulence,
      atmosphereDensity: recipe.effects.atmosphereScale,
      bloomStrength: recipe.effects.bloom,
      cameraDepth: recipe.camera.distance,
      timeScale: recipe.motion === 'STATIC' ? 0 : 1.0,
      eventFrequency: recipe.atmosphere === 'STORMY' || recipe.atmosphere === 'ENERGETIC' ? 1.5 : 0.8
    };
  }

  /**
   * Translates recipe into EnvironmentDNA (for ProceduralEnvironmentWallpaper).
   */
  public static toEnvironmentDNA(recipe: UniverseRecipe): EnvironmentDNA {
    const base = EnvironmentDNAFactory.getPresetByBiome(recipe.environment.biome, recipe.numericSeed);

    const categoryMap: Record<string, BiomeCategory> = {
      'SPACE': 'Futuristic',
      'CYBER CITY': 'Futuristic',
      'CRYSTAL': 'Fantasy',
      'ENERGY': 'Elements',
      'VOLCANO': 'Elements',
      'OCEAN': 'Nature',
      'MOUNTAIN': 'Nature',
      'FOREST': 'Nature',
      'NATURE': 'Nature',
      'FANTASY': 'Fantasy',
      'ABSTRACT': 'Fantasy',
      'MIXED': 'Fantasy',
      'RANDOM': 'Nature'
    };

    return {
      ...base,
      id: `env-personal-${recipe.seed}`,
      name: recipe.name,
      seed: recipe.numericSeed,
      category: categoryMap[recipe.worldType] || 'Nature',
      biome: recipe.environment.biome,
      timeOfDay: recipe.time.timeOfDay,
      timeCycleSpeed: recipe.time.timeCycleSpeed,
      terrain: {
        ...base.terrain,
        type: recipe.environment.terrainType,
        colorPrimary: recipe.colors.primary,
        colorSecondary: recipe.colors.secondary,
        colorRock: recipe.colors.accent,
        wireframe: recipe.style === 'NEON' || recipe.style === 'FUTURISTIC'
      },
      atmosphere: {
        ...base.atmosphere,
        fogDensity: recipe.effects.fog * 0.05,
        fogColor: recipe.colors.background,
        skyColorTop: recipe.colors.background,
        skyColorBottom: recipe.colors.secondary,
        hasAurora: recipe.lighting.hasAurora,
        hasStars: recipe.lighting.hasStars,
        starDensity: recipe.lighting.starDensity,
        ambientIntensity: recipe.lighting.ambientIntensity,
        sunIntensity: recipe.lighting.sunIntensity
      },
      weather: {
        ...base.weather,
        type: recipe.weather.type,
        intensity: recipe.weather.intensity,
        windSpeed: recipe.weather.windSpeed,
        particleCount: recipe.particles.count,
        cloudDensity: recipe.weather.cloudDensity
      },
      liquid: {
        ...base.liquid,
        hasWater: recipe.environment.liquidType === 'water',
        hasLava: recipe.environment.liquidType === 'lava',
        waterColor: recipe.colors.primary,
        waterDeepColor: recipe.colors.secondary,
        lavaColor: recipe.colors.primary,
        lavaGlowColor: recipe.colors.accent
      },
      structures: {
        ...base.structures,
        type: recipe.environment.structureType,
        color: recipe.colors.secondary,
        secondaryColor: recipe.colors.accent,
        neonGlowColor: recipe.colors.glow,
        density: recipe.performance === 'BATTERY SAVER' ? 0.5 : 1.2
      },
      camera: {
        behavior: recipe.camera.behavior,
        distance: recipe.camera.distance,
        height: 12,
        fov: recipe.camera.fov
      },
      accentColor: recipe.colors.primary
    };
  }

  /**
   * Translates recipe into EcosystemDNA (for living life simulation).
   */
  public static toEcosystemDNA(recipe: UniverseRecipe): EcosystemDNA {
    const base = EcosystemDNAFactory.createDefault(recipe.environment.biome, recipe.numericSeed);

    return {
      ...base,
      seed: recipe.numericSeed,
      enabled: recipe.ecosystem.enabled,
      ecosystemEnabled: recipe.ecosystem.enabled,
      entityDensity: recipe.ecosystem.density,
      activityLevel: recipe.ecosystem.activity,
      allowedEntities: recipe.ecosystem.entities.length > 0 ? recipe.ecosystem.entities : base.allowedEntities,
      motionReaction: recipe.motionProfile.sensitivity,
      touchReaction: recipe.motionProfile.touchInteraction ? 1.5 : 0.0
    };
  }

  /**
   * Translates recipe into FusionDNA (for InfiniteWorldWallpaper).
   */
  public static toFusionDNA(recipe: UniverseRecipe): FusionDNA {
    const systemMap: Record<string, FusionSystemType> = {
      'SPACE': 'galaxy',
      'OCEAN': 'ocean',
      'FOREST': 'forest',
      'MOUNTAIN': 'mountain',
      'VOLCANO': 'volcano',
      'CYBER CITY': 'cyber-city',
      'CRYSTAL': 'crystal',
      'ENERGY': 'energy',
      'FANTASY': 'floating-islands',
      'ABSTRACT': 'crystal',
      'MIXED': 'aurora',
      'NATURE': 'forest',
      'RANDOM': 'galaxy'
    };

    const primarySys = systemMap[recipe.worldType] || 'galaxy';
    const secondarySys = recipe.environment.liquidType === 'water' ? 'ocean' :
      recipe.environment.liquidType === 'lava' ? 'volcano' :
      recipe.lighting.hasAurora ? 'aurora' : 'space';

    return {
      id: `fusion-personal-${recipe.seed}`,
      name: recipe.name,
      description: `Procedural ${recipe.worldType} world in ${recipe.style} style (${recipe.seed}).`,
      baseWorldSeed: recipe.numericSeed,
      secondaryWorldSeed: recipe.numericSeed + 77,
      environmentSeed: recipe.numericSeed,
      ecosystemSeed: recipe.numericSeed,
      primarySystem: primarySys,
      secondarySystem: secondarySys,
      fusionAmount: 0.5,
      terrainBlend: 0.5,
      atmosphereBlend: 0.6,
      weatherBlend: 0.5,
      lightingBlend: 0.5,
      particleBlend: 0.7,
      physicsBlend: 0.5,
      ecosystemBlend: 0.5,
      eventBlend: 0.5,
      weatherType: recipe.weather.type,
      primaryBiome: recipe.environment.biome,
      secondaryBiome: 'space-city',
      allowedEntities: recipe.ecosystem.entities,
      gravity: recipe.physics.gravity,
      atmosphereFogDensity: recipe.effects.fog * 0.04,
      primaryColor: recipe.colors.primary,
      secondaryColor: recipe.colors.secondary,
      accentColor: recipe.colors.accent,
      tags: [recipe.worldType.toLowerCase(), recipe.style.toLowerCase(), 'personal-universe', recipe.seed],
      createdAt: recipe.createdAt,
      isFavorite: false
    };
  }

  /**
   * Translates recipe into DesignDNA (for WallpaperFusionEngine).
   */
  public static toDesignDNA(recipe: UniverseRecipe): DesignDNA {
    const fusionElements: FusionElement[] = [];

    // Map world elements
    if (recipe.worldType === 'SPACE') fusionElements.push('SPACE', 'GALAXY', 'NEBULA');
    else if (recipe.worldType === 'OCEAN') fusionElements.push('OCEAN', 'PARTICLES');
    else if (recipe.worldType === 'FOREST') fusionElements.push('FOREST', 'LIVING WORLD');
    else if (recipe.worldType === 'MOUNTAIN') fusionElements.push('MOUNTAIN');
    else if (recipe.worldType === 'VOLCANO') fusionElements.push('VOLCANO', 'LAVA');
    else if (recipe.worldType === 'CYBER CITY') fusionElements.push('CYBER CITY', 'NEON');
    else if (recipe.worldType === 'CRYSTAL') fusionElements.push('CRYSTAL');
    else if (recipe.worldType === 'ENERGY') fusionElements.push('ENERGY');
    else if (recipe.worldType === 'FANTASY') fusionElements.push('PORTAL', 'LIVING WORLD');
    else if (recipe.worldType === 'ABSTRACT') fusionElements.push('FRACTAL');
    else fusionElements.push('SPACE', 'LIVING WORLD');

    if (recipe.lighting.hasAurora) fusionElements.push('AURORA');
    if (recipe.weather.type === 'snow') fusionElements.push('SNOW');
    if (recipe.weather.type === 'rain') fusionElements.push('RAIN');

    const defaultLayer: LayerConfig = {
      enabled: true,
      intensity: 1.0,
      scale: 1.0,
      speed: 1.0,
      depth: 0,
      opacity: 1.0,
      interactionStrength: recipe.motionProfile.sensitivity
    };

    const layers: Record<LayerType, LayerConfig> = {
      'Background': { ...defaultLayer, opacity: 1.0, depth: -40 },
      'Sky': { ...defaultLayer, enabled: recipe.lighting.hasStars || recipe.lighting.hasAurora, opacity: 0.9, depth: -30 },
      'Environment': { ...defaultLayer, opacity: 0.85, depth: -15 },
      'Terrain': { ...defaultLayer, enabled: recipe.worldType !== 'SPACE', opacity: 1.0, depth: -5 },
      'Main Object': { ...defaultLayer, opacity: 1.0, depth: 0 },
      'Particles': { ...defaultLayer, intensity: recipe.particles.count / 2000, speed: recipe.particles.speed, depth: 5 },
      'Atmosphere': { ...defaultLayer, intensity: recipe.effects.fog, opacity: 0.7, depth: 10 },
      'Lighting': { ...defaultLayer, intensity: recipe.lighting.sunIntensity, depth: 15 },
      'Effects': { ...defaultLayer, enabled: recipe.effects.postProcessing, intensity: recipe.effects.bloom, depth: 20 },
      'Foreground': { ...defaultLayer, opacity: 0.4, depth: 25 }
    };

    const colorPresetMap: Record<string, any> = {
      'AMOLED': 'AMOLED',
      'NEON': 'NEON',
      'COSMIC': 'COSMIC',
      'OCEAN': 'OCEAN',
      'FOREST': 'FOREST',
      'FIRE': 'FIRE',
      'CRYSTAL': 'CRYSTAL',
      'CYBER': 'CYBER',
      'FANTASY': 'FANTASY'
    };

    return {
      seed: recipe.seed,
      name: recipe.name,
      elements: fusionElements,
      layers,
      material: {
        type: recipe.materials.type,
        roughness: recipe.materials.roughness,
        metalness: recipe.materials.metalness,
        transmission: recipe.materials.transmission,
        ior: 1.5,
        emissiveIntensity: recipe.materials.emissiveIntensity,
        wireframe: recipe.style === 'NEON',
        pulseSpeed: recipe.motion === 'STATIC' ? 0.1 : 1.0,
        dispersion: 0.3,
        audioReactivity: recipe.audio.enabled ? recipe.audio.sensitivity : 0.0
      },
      colors: {
        primary: recipe.colors.primary,
        secondary: recipe.colors.secondary,
        accent: recipe.colors.accent,
        glow: recipe.colors.glow,
        background: recipe.colors.background,
        preset: colorPresetMap[recipe.style] || 'COSMIC',
        harmony: 'complementary'
      },
      physics: {
        particleDensity: recipe.particles.count / 3000,
        particleSize: recipe.particles.size,
        particleSpeed: recipe.particles.speed,
        gravity: recipe.physics.gravity,
        wind: recipe.weather.windSpeed,
        turbulence: recipe.physics.turbulence,
        vortexStrength: recipe.physics.vortexStrength,
        attraction: 0.5,
        repulsion: 0.2,
        shockwaveActive: recipe.audio.enabled
      },
      camera: {
        depth: recipe.camera.distance,
        fov: recipe.camera.fov,
        driftSpeed: recipe.camera.driftSpeed,
        orbitSpeed: recipe.camera.orbitSpeed,
        distance: recipe.camera.distance
      },
      motion: {
        mode: recipe.motion === 'STATIC' ? 'OFF' : recipe.motion === 'SUBTLE' ? 'Subtle' : recipe.motion === 'DYNAMIC' ? 'Dynamic' : 'Balanced',
        sensitivity: recipe.motionProfile.sensitivity,
        touchInteraction: recipe.motionProfile.touchInteraction,
        touchSensitivity: recipe.motionProfile.sensitivity
      },
      audio: {
        enabled: recipe.audio.enabled,
        bassToScale: true,
        midToMovement: true,
        trebleToParticles: true,
        beatToShockwave: true,
        energyToBloom: true,
        sensitivity: recipe.audio.sensitivity
      },
      effects: {
        bloom: recipe.effects.bloom,
        fog: recipe.effects.fog,
        atmosphere: recipe.effects.atmosphereScale,
        worldScale: 1.0,
        animationSpeed: recipe.motion === 'STATIC' ? 0.0 : 1.0,
        eventFrequency: 1.0,
        weather: recipe.weather.type === 'rain' ? 'rain' : recipe.weather.type === 'snow' ? 'snow' : recipe.lighting.hasAurora ? 'cosmic-aurora' : 'clear',
        ecosystem: recipe.ecosystem.enabled ? 'flourishing' : 'dormant'
      },
      estimatedComplexity: recipe.performance === 'BATTERY SAVER' ? 35 : recipe.performance === 'ULTRA' ? 92 : 65,
      timestamp: recipe.createdAt
    };
  }
}
