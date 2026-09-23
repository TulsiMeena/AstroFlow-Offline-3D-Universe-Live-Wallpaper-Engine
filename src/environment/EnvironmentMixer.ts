import { EnvironmentDNA, WeatherType } from './types/environmentDNA';
import { EnvironmentRegistry } from './EnvironmentRegistry';

export interface MixedRecipe {
  id: string;
  name: string;
  primaryBiome: string;
  secondaryBiome: string;
  description: string;
}

export class EnvironmentMixer {
  public static readonly POPULAR_RECIPES: MixedRecipe[] = [
    {
      id: 'forest-aurora',
      name: 'Forest + Aurora',
      primaryBiome: 'living-forest',
      secondaryBiome: 'aurora-world',
      description: 'Ancient living pine woods underneath pulsating emerald northern lights.'
    },
    {
      id: 'forest-rain',
      name: 'Forest + Rain',
      primaryBiome: 'living-forest',
      secondaryBiome: 'rain-world',
      description: 'Moody temperate rainforest with rhythmic rainfall, puddles and mist.'
    },
    {
      id: 'city-rain',
      name: 'City + Rain',
      primaryBiome: 'cyber-city',
      secondaryBiome: 'heavy-rain',
      description: 'Slick neon reflection highways in a torrential cyberpunk downpour.'
    },
    {
      id: 'city-snow',
      name: 'City + Snow',
      primaryBiome: 'cyber-city',
      secondaryBiome: 'snow-world',
      description: 'Ethereal futuristic megacity frosted with calm drifting snow particles.'
    },
    {
      id: 'volcano-snow',
      name: 'Volcano + Snow',
      primaryBiome: 'volcano-world',
      secondaryBiome: 'snow-world',
      description: 'Dramatic clash of fire and ice: molten magma rivers amid freezing blizzards.'
    },
    {
      id: 'ocean-storm',
      name: 'Ocean + Storm',
      primaryBiome: 'ocean-world',
      secondaryBiome: 'thunder-storm',
      description: 'Violent surging procedural sea waves illuminated by electric lightning arcs.'
    },
    {
      id: 'ocean-aurora',
      name: 'Ocean + Aurora',
      primaryBiome: 'ocean-world',
      secondaryBiome: 'aurora-world',
      description: 'Midnight calm sea waters mirroring cosmic green and violet aurora ribbons.'
    },
    {
      id: 'desert-sunset',
      name: 'Desert + Sunset',
      primaryBiome: 'desert-oasis',
      secondaryBiome: 'sunset-sunrise',
      description: 'Rolling golden sand dunes drenched in deep crimson and amber sunset.'
    },
    {
      id: 'crystal-energy',
      name: 'Crystal + Energy',
      primaryBiome: 'crystal-world',
      secondaryBiome: 'plasma-world',
      description: 'Prismatic faceted crystals humming with plasma lightning and cyan glow.'
    },
    {
      id: 'cyber-rain',
      name: 'Cyber + Rain',
      primaryBiome: 'digital-grid',
      secondaryBiome: 'rain-world',
      description: 'Matrix neon wireframe terrain bathed in high-speed digital rain streaks.'
    },
    {
      id: 'mountain-aurora',
      name: 'Mountain + Aurora',
      primaryBiome: 'mountain-world',
      secondaryBiome: 'aurora-world',
      description: 'Towering jagged alpine ridges framed by celestial solar curtains.'
    },
    {
      id: 'fantasy-portal',
      name: 'Fantasy + Portal',
      primaryBiome: 'floating-islands',
      secondaryBiome: 'time-tunnel',
      description: 'Anti-gravity floating rock sanctuaries connected through warp wormholes.'
    }
  ];

  /**
   * Procedurally mixes two EnvironmentDNAs with a blend ratio (0.0 = 100% DNA A, 1.0 = 100% DNA B)
   */
  public static mix(dnaA: EnvironmentDNA, dnaB: EnvironmentDNA, ratio: number = 0.5): EnvironmentDNA {
    const r = Math.max(0, Math.min(1, ratio));
    const invR = 1 - r;

    // Determine hybrid weather
    let weatherType: WeatherType = dnaA.weather.type;
    if (r > 0.6) {
      weatherType = dnaB.weather.type;
    } else if (dnaB.weather.type !== 'clear') {
      weatherType = dnaB.weather.type; // adopt the active weather of secondary
    }

    const mixedDNA: EnvironmentDNA = {
      id: `mixed-${dnaA.biome}-${dnaB.biome}-${Math.round(r * 100)}`,
      name: `${dnaA.name} ✕ ${dnaB.name}`,
      category: r < 0.5 ? dnaA.category : dnaB.category,
      biome: r < 0.5 ? dnaA.biome : dnaB.biome,
      seed: Math.floor(dnaA.seed * invR + dnaB.seed * r),
      description: `Procedural hybrid fusion of ${dnaA.name} and ${dnaB.name}.`,

      timeOfDay: r > 0.5 ? dnaB.timeOfDay : dnaA.timeOfDay,
      timeCycleSpeed: dnaA.timeCycleSpeed * invR + dnaB.timeCycleSpeed * r,

      terrain: {
        type: r < 0.5 ? dnaA.terrain.type : dnaB.terrain.type,
        heightScale: dnaA.terrain.heightScale * invR + dnaB.terrain.heightScale * r,
        roughness: dnaA.terrain.roughness * invR + dnaB.terrain.roughness * r,
        plateauRatio: dnaA.terrain.plateauRatio * invR + dnaB.terrain.plateauRatio * r,
        colorPrimary: r < 0.5 ? dnaA.terrain.colorPrimary : dnaB.terrain.colorPrimary,
        colorSecondary: r < 0.5 ? dnaA.terrain.colorSecondary : dnaB.terrain.colorSecondary,
        colorRock: r < 0.5 ? dnaA.terrain.colorRock : dnaB.terrain.colorRock,
        wireframe: dnaA.terrain.wireframe || dnaB.terrain.wireframe
      },

      atmosphere: {
        fogDensity: dnaA.atmosphere.fogDensity * invR + dnaB.atmosphere.fogDensity * r,
        fogColor: r < 0.5 ? dnaA.atmosphere.fogColor : dnaB.atmosphere.fogColor,
        skyColorTop: r < 0.5 ? dnaA.atmosphere.skyColorTop : dnaB.atmosphere.skyColorTop,
        skyColorBottom: r < 0.5 ? dnaA.atmosphere.skyColorBottom : dnaB.atmosphere.skyColorBottom,
        ambientIntensity: dnaA.atmosphere.ambientIntensity * invR + dnaB.atmosphere.ambientIntensity * r,
        sunIntensity: dnaA.atmosphere.sunIntensity * invR + dnaB.atmosphere.sunIntensity * r,
        sunColor: r < 0.5 ? dnaA.atmosphere.sunColor : dnaB.atmosphere.sunColor,
        hasAurora: dnaA.atmosphere.hasAurora || dnaB.atmosphere.hasAurora,
        auroraColorA: dnaB.atmosphere.hasAurora ? dnaB.atmosphere.auroraColorA : dnaA.atmosphere.auroraColorA,
        auroraColorB: dnaB.atmosphere.hasAurora ? dnaB.atmosphere.auroraColorB : dnaA.atmosphere.auroraColorB,
        hasStars: dnaA.atmosphere.hasStars || dnaB.atmosphere.hasStars,
        starDensity: Math.round(dnaA.atmosphere.starDensity * invR + dnaB.atmosphere.starDensity * r)
      },

      weather: {
        type: weatherType,
        intensity: dnaA.weather.intensity * invR + dnaB.weather.intensity * r,
        windSpeed: dnaA.weather.windSpeed * invR + dnaB.weather.windSpeed * r,
        windDirection: [
          dnaA.weather.windDirection[0] * invR + dnaB.weather.windDirection[0] * r,
          dnaA.weather.windDirection[1] * invR + dnaB.weather.windDirection[1] * r,
          dnaA.weather.windDirection[2] * invR + dnaB.weather.windDirection[2] * r
        ],
        particleCount: Math.round(dnaA.weather.particleCount * invR + dnaB.weather.particleCount * r),
        lightningFrequency: Math.max(dnaA.weather.lightningFrequency, dnaB.weather.lightningFrequency),
        cloudDensity: dnaA.weather.cloudDensity * invR + dnaB.weather.cloudDensity * r
      },

      liquid: {
        hasWater: dnaA.liquid.hasWater || dnaB.liquid.hasWater,
        waterLevel: dnaA.liquid.waterLevel * invR + dnaB.liquid.waterLevel * r,
        waterColor: dnaA.liquid.hasWater ? dnaA.liquid.waterColor : dnaB.liquid.waterColor,
        waterDeepColor: dnaA.liquid.hasWater ? dnaA.liquid.waterDeepColor : dnaB.liquid.waterDeepColor,
        waveHeight: dnaA.liquid.waveHeight * invR + dnaB.liquid.waveHeight * r,
        waveSpeed: dnaA.liquid.waveSpeed * invR + dnaB.liquid.waveSpeed * r,
        hasFoam: dnaA.liquid.hasFoam || dnaB.liquid.hasFoam,
        hasUnderwaterDepth: dnaA.liquid.hasUnderwaterDepth || dnaB.liquid.hasUnderwaterDepth,

        hasLava: dnaA.liquid.hasLava || dnaB.liquid.hasLava,
        lavaLevel: dnaA.liquid.lavaLevel * invR + dnaB.liquid.lavaLevel * r,
        lavaColor: dnaA.liquid.hasLava ? dnaA.liquid.lavaColor : dnaB.liquid.lavaColor,
        lavaGlowColor: dnaA.liquid.hasLava ? dnaA.liquid.lavaGlowColor : dnaB.liquid.lavaGlowColor,
        lavaFlowSpeed: dnaA.liquid.lavaFlowSpeed * invR + dnaB.liquid.lavaFlowSpeed * r
      },

      structures: {
        density: dnaA.structures.density * invR + dnaB.structures.density * r,
        type: r < 0.5 ? dnaA.structures.type : dnaB.structures.type,
        color: r < 0.5 ? dnaA.structures.color : dnaB.structures.color,
        secondaryColor: r < 0.5 ? dnaA.structures.secondaryColor : dnaB.structures.secondaryColor,
        neonGlowColor: r < 0.5 ? dnaA.structures.neonGlowColor : dnaB.structures.neonGlowColor,
        scale: dnaA.structures.scale * invR + dnaB.structures.scale * r,
        animated: dnaA.structures.animated || dnaB.structures.animated
      },

      physics: {
        gravity: dnaA.physics.gravity * invR + dnaB.physics.gravity * r,
        eventFrequency: dnaA.physics.eventFrequency * invR + dnaB.physics.eventFrequency * r,
        interactionStrength: dnaA.physics.interactionStrength * invR + dnaB.physics.interactionStrength * r,
        motionParallaxMultiplier:
          dnaA.physics.motionParallaxMultiplier * invR + dnaB.physics.motionParallaxMultiplier * r
      },

      camera: {
        behavior: r < 0.5 ? dnaA.camera.behavior : dnaB.camera.behavior,
        distance: dnaA.camera.distance * invR + dnaB.camera.distance * r,
        height: dnaA.camera.height * invR + dnaB.camera.height * r,
        fov: dnaA.camera.fov * invR + dnaB.camera.fov * r
      },

      accentColor: r < 0.5 ? dnaA.accentColor : dnaB.accentColor
    };

    return mixedDNA;
  }

  public static mixFromRecipe(recipe: MixedRecipe, ratio: number = 0.5): EnvironmentDNA | null {
    const registry = EnvironmentRegistry.getInstance();
    const presetA = registry.getPresetById(recipe.primaryBiome);
    const presetB = registry.getPresetById(recipe.secondaryBiome);

    if (!presetA || !presetB) return null;
    return this.mix(presetA.dna, presetB.dna, ratio);
  }
}
