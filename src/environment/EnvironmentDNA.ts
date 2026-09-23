import { EnvironmentDNA, BiomeType, BiomeCategory, WeatherType, TimeOfDay } from './types/environmentDNA';

export class EnvironmentDNAFactory {
  public static createDefault(biome: BiomeType = 'living-forest', seed: number = 42): EnvironmentDNA {
    return this.getPresetByBiome(biome, seed);
  }

  public static getPresetByBiome(biome: BiomeType, seed: number = 42): EnvironmentDNA {
    const base: EnvironmentDNA = {
      id: `env-${biome}-${seed}`,
      name: this.formatName(biome),
      category: this.getCategoryForBiome(biome),
      biome,
      seed,
      description: `A rich procedural ${this.formatName(biome)} simulation.`,
      timeOfDay: 'day',
      timeCycleSpeed: 0.02,
      terrain: {
        type: 'rolling-hills',
        heightScale: 1.0,
        roughness: 1.0,
        plateauRatio: 0,
        colorPrimary: '#2a5a30',
        colorSecondary: '#408040',
        colorRock: '#555555',
        wireframe: false
      },
      atmosphere: {
        fogDensity: 0.025,
        fogColor: '#1a3028',
        skyColorTop: '#102230',
        skyColorBottom: '#183848',
        ambientIntensity: 0.6,
        sunIntensity: 1.2,
        sunColor: '#ffffff',
        hasAurora: false,
        auroraColorA: '#00ff88',
        auroraColorB: '#7700ff',
        hasStars: true,
        starDensity: 1500
      },
      weather: {
        type: 'clear',
        intensity: 0.5,
        windSpeed: 1.0,
        windDirection: [1, 0, 0],
        particleCount: 1500,
        lightningFrequency: 0,
        cloudDensity: 0.3
      },
      liquid: {
        hasWater: false,
        waterLevel: 0,
        waterColor: '#0a3a5a',
        waterDeepColor: '#041525',
        waveHeight: 0.3,
        waveSpeed: 1.0,
        hasFoam: false,
        hasUnderwaterDepth: false,
        hasLava: false,
        lavaLevel: 0,
        lavaColor: '#ff4400',
        lavaGlowColor: '#ff8800',
        lavaFlowSpeed: 1.0
      },
      structures: {
        density: 1.0,
        type: 'trees',
        color: '#2d7a3a',
        secondaryColor: '#409040',
        neonGlowColor: '#00ffaa',
        scale: 1.0,
        animated: true
      },
      physics: {
        gravity: 9.8,
        eventFrequency: 1.0,
        interactionStrength: 1.2,
        motionParallaxMultiplier: 1.0
      },
      camera: {
        behavior: 'cinematic-orbit',
        distance: 8.0,
        height: 3.5,
        fov: 60
      },
      accentColor: '#00ffa3'
    };

    // Specialize per biome
    switch (biome) {
      // NATURE
      case 'ocean-world':
        base.category = 'Nature';
        base.terrain.type = 'flat';
        base.terrain.heightScale = 0.2;
        base.liquid.hasWater = true;
        base.liquid.waterLevel = 0.4;
        base.liquid.waveHeight = 0.7;
        base.liquid.hasFoam = true;
        base.structures.type = 'none';
        base.accentColor = '#00d2ff';
        break;

      case 'underwater-world':
        base.category = 'Nature';
        base.timeOfDay = 'night';
        base.atmosphere.fogDensity = 0.06;
        base.atmosphere.fogColor = '#001a33';
        base.liquid.hasWater = true;
        base.liquid.waterLevel = 5.0;
        base.liquid.hasUnderwaterDepth = true;
        base.structures.type = 'crystals';
        base.structures.color = '#00f0ff';
        base.accentColor = '#00e5ff';
        break;

      case 'bamboo-forest':
        base.category = 'Nature';
        base.terrain.colorPrimary = '#1f3d1f';
        base.structures.type = 'bamboo';
        base.structures.density = 1.3;
        base.structures.color = '#4ade80';
        base.atmosphere.fogColor = '#1e3825';
        base.accentColor = '#4ade80';
        break;

      case 'mountain-world':
      case 'mountain-clouds':
        base.category = 'Nature';
        base.terrain.type = 'mountains';
        base.terrain.heightScale = 2.4;
        base.terrain.colorPrimary = '#2b3a4a';
        base.terrain.colorRock = '#5a6878';
        base.structures.type = 'trees';
        base.structures.density = 0.4;
        base.weather.cloudDensity = biome === 'mountain-clouds' ? 0.8 : 0.4;
        base.accentColor = '#60a5fa';
        break;

      case 'waterfall-world':
      case 'tropical-world':
        base.category = 'Nature';
        base.terrain.type = 'canyons';
        base.terrain.heightScale = 1.6;
        base.liquid.hasWater = true;
        base.liquid.waterLevel = 0.2;
        base.structures.type = 'trees';
        base.accentColor = '#2dd4bf';
        break;

      case 'desert-oasis':
        base.category = 'Nature';
        base.timeOfDay = 'sunset';
        base.terrain.type = 'dunes';
        base.terrain.heightScale = 1.2;
        base.terrain.colorPrimary = '#c29b62';
        base.terrain.colorSecondary = '#e0b579';
        base.liquid.hasWater = true;
        base.liquid.waterLevel = -0.2;
        base.structures.type = 'bamboo';
        base.accentColor = '#f59e0b';
        break;

      case 'cave-world':
        base.category = 'Nature';
        base.timeOfDay = 'night';
        base.terrain.type = 'caves';
        base.structures.type = 'crystals';
        base.structures.density = 0.6;
        base.atmosphere.fogDensity = 0.04;
        base.accentColor = '#a855f7';
        break;

      // WEATHER
      case 'rain-world':
      case 'heavy-rain':
        base.category = 'Weather';
        base.weather.type = biome === 'heavy-rain' ? 'heavy-rain' : 'rain';
        base.weather.particleCount = biome === 'heavy-rain' ? 6000 : 3000;
        base.weather.windSpeed = 2.0;
        base.atmosphere.fogColor = '#1f2937';
        base.atmosphere.skyColorTop = '#111827';
        base.accentColor = '#38bdf8';
        break;

      case 'snow-world':
        base.category = 'Weather';
        base.weather.type = 'snow';
        base.weather.particleCount = 3500;
        base.terrain.colorPrimary = '#e2e8f0';
        base.terrain.colorSecondary = '#cbd5e1';
        base.atmosphere.fogColor = '#94a3b8';
        base.accentColor = '#e0f2fe';
        break;

      case 'thunder-storm':
        base.category = 'Weather';
        base.weather.type = 'storm';
        base.weather.particleCount = 5000;
        base.weather.lightningFrequency = 0.6;
        base.atmosphere.fogColor = '#0f172a';
        base.accentColor = '#fbbf24';
        break;

      case 'aurora-world':
        base.category = 'Weather';
        base.timeOfDay = 'night';
        base.atmosphere.hasAurora = true;
        base.atmosphere.hasStars = true;
        base.terrain.type = 'mountains';
        base.terrain.heightScale = 1.4;
        base.accentColor = '#34d399';
        break;

      case 'sunset-sunrise':
        base.category = 'Weather';
        base.timeOfDay = 'sunset';
        base.atmosphere.skyColorTop = '#581c87';
        base.atmosphere.skyColorBottom = '#ea580c';
        base.terrain.type = 'rolling-hills';
        base.accentColor = '#f97316';
        break;

      // ELEMENTS
      case 'volcano-world':
      case 'lava-flow':
      case 'fire-ember':
        base.category = 'Elements';
        base.timeOfDay = 'night';
        base.terrain.type = 'mountains';
        base.terrain.heightScale = 2.2;
        base.terrain.colorPrimary = '#1c1917';
        base.terrain.colorRock = '#292524';
        base.liquid.hasLava = true;
        base.liquid.lavaLevel = 0.3;
        base.weather.type = 'embers';
        base.weather.particleCount = 2000;
        base.structures.type = 'none';
        base.accentColor = '#ff4500';
        break;

      case 'plasma-world':
      case 'energy-world':
      case 'lightning-world':
        base.category = 'Elements';
        base.timeOfDay = 'night';
        base.terrain.type = 'fractal';
        base.structures.type = 'crystals';
        base.structures.color = '#ec4899';
        base.structures.neonGlowColor = '#06b6d4';
        base.weather.type = 'cyber-dust';
        base.accentColor = '#ec4899';
        break;

      // FUTURISTIC
      case 'cyber-city':
      case 'neon-highway':
      case 'futuristic-city':
      case 'hologram-city':
      case 'digital-grid':
      case 'space-city':
      case 'scifi-station':
      case 'robot-mechanical':
        base.category = 'Futuristic';
        base.timeOfDay = 'night';
        base.terrain.type = 'cyber-grid';
        base.terrain.wireframe = biome === 'digital-grid';
        base.terrain.colorPrimary = '#020617';
        base.terrain.colorSecondary = '#00f0ff';
        base.structures.type = 'skyscrapers';
        base.structures.density = 1.2;
        base.structures.color = '#090d16';
        base.structures.neonGlowColor = '#00f0ff';
        base.structures.secondaryColor = '#ff007f';
        base.atmosphere.fogColor = '#050914';
        base.weather.type = 'cyber-dust';
        base.accentColor = '#00f0ff';
        break;

      // FANTASY / ABSTRACT
      case 'crystal-world':
      case 'liquid-glass':
        base.category = 'Fantasy';
        base.timeOfDay = 'twilight';
        base.terrain.type = 'rolling-hills';
        base.structures.type = 'crystals';
        base.structures.density = 1.4;
        base.structures.color = '#38bdf8';
        base.structures.neonGlowColor = '#a855f7';
        base.accentColor = '#a855f7';
        break;

      case 'floating-islands':
        base.category = 'Fantasy';
        base.terrain.type = 'floating-rocks';
        base.structures.type = 'crystals';
        base.structures.density = 0.5;
        base.accentColor = '#818cf8';
        break;

      case 'fractal-world':
        base.category = 'Fantasy';
        base.terrain.type = 'fractal';
        base.structures.type = 'fractals';
        base.accentColor = '#10b981';
        break;

      case 'organic-world':
      case 'micro-world':
        base.category = 'Fantasy';
        base.terrain.type = 'caves';
        base.structures.type = 'organic-cells';
        base.structures.color = '#f43f5e';
        base.structures.secondaryColor = '#8b5cf6';
        base.accentColor = '#f43f5e';
        break;

      case 'portal-world':
      case 'time-tunnel':
      case 'dream-world':
        base.category = 'Fantasy';
        base.timeOfDay = 'night';
        base.terrain.type = 'flat';
        base.terrain.heightScale = 0.1;
        base.structures.type = 'portals';
        base.structures.color = '#f43f5e';
        base.structures.neonGlowColor = '#00f0ff';
        base.accentColor = '#00f0ff';
        break;
    }

    return base;
  }

  public static getCategoryForBiome(biome: BiomeType): BiomeCategory {
    if (
      [
        'ocean-world',
        'underwater-world',
        'living-forest',
        'bamboo-forest',
        'mountain-world',
        'mountain-clouds',
        'waterfall-world',
        'tropical-world',
        'desert-oasis',
        'cave-world'
      ].includes(biome)
    ) {
      return 'Nature';
    }
    if (
      [
        'rain-world',
        'heavy-rain',
        'snow-world',
        'thunder-storm',
        'wind-storm',
        'fog-world',
        'aurora-world',
        'sunset-sunrise'
      ].includes(biome)
    ) {
      return 'Weather';
    }
    if (
      [
        'volcano-world',
        'lava-flow',
        'fire-ember',
        'lightning-world',
        'plasma-world',
        'energy-world',
        'liquid-world',
        'smoke-fog'
      ].includes(biome)
    ) {
      return 'Elements';
    }
    if (
      [
        'cyber-city',
        'neon-highway',
        'futuristic-city',
        'hologram-city',
        'space-city',
        'scifi-station',
        'robot-mechanical',
        'digital-grid'
      ].includes(biome)
    ) {
      return 'Futuristic';
    }
    return 'Fantasy';
  }

  public static formatName(str: string): string {
    return str
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
