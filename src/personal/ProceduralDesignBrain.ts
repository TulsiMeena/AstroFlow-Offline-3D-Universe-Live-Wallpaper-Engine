import { WorldType, WorldAtmosphere, WorldMotion, WorldPerformance, ParsedPromptDirectives } from './types';
import { BiomeType, WeatherType, TimeOfDay } from '../environment/types/environmentDNA';
import { LifeEntityType } from '../living/EcosystemDNA';
import { StyleAesthetics } from './StyleGenerator';
import { SeededRNG } from '../universe/seed/SeededRNG';

export interface BrainDecisions {
  effectiveWorldType: WorldType;
  biome: BiomeType;
  terrainType: 'flat' | 'mountains' | 'rolling-hills' | 'canyons' | 'floating-rocks' | 'caves' | 'dunes' | 'cyber-grid' | 'fractal';
  liquidType: 'none' | 'water' | 'lava' | 'plasma' | 'crystals';
  structureType: 'none' | 'trees' | 'bamboo' | 'crystals' | 'skyscrapers' | 'floating-islands' | 'fractals' | 'portals' | 'organic-cells';
  weatherType: WeatherType;
  weatherIntensity: number;
  windSpeed: number;
  cloudDensity: number;
  timeOfDay: TimeOfDay;
  timeCycleSpeed: number;
  sunIntensity: number;
  ambientIntensity: number;
  hasAurora: boolean;
  hasStars: boolean;
  starDensity: number;
  particleCount: number;
  particleSpeed: number;
  particleSize: number;
  particleTurbulence: number;
  particleType: 'cosmic' | 'dust' | 'bubbles' | 'snow' | 'rain' | 'sparks' | 'cyber' | 'spores';
  gravity: number;
  physicsTurbulence: number;
  interactionStrength: number;
  vortexStrength: number;
  ecosystemEnabled: boolean;
  ecosystemDensity: number;
  ecosystemActivity: number;
  ecosystemEntities: LifeEntityType[];
  cameraFov: number;
  cameraDistance: number;
  cameraDrift: number;
  cameraOrbit: number;
  cameraBehavior: 'cinematic-orbit' | 'fly-through' | 'gentle-sway' | 'floating-observer' | 'dynamic-parallex';
  motionSensitivity: number;
  touchInteraction: boolean;
  parallaxMultiplier: number;
  audioEnabled: boolean;
  audioSensitivity: number;
  audioReactiveMode: 'bloom' | 'motion' | 'particles' | 'all';
}

export class ProceduralDesignBrain {
  public static evaluate(
    worldType: WorldType,
    atmosphere: WorldAtmosphere,
    motion: WorldMotion,
    performance: WorldPerformance,
    aesthetics: StyleAesthetics,
    directives: ParsedPromptDirectives,
    rng: SeededRNG
  ): BrainDecisions {
    // 1. Resolve effective world type
    let effectiveType: WorldType = worldType;
    if (effectiveType === 'RANDOM') {
      const types: WorldType[] = ['SPACE', 'NATURE', 'OCEAN', 'MOUNTAIN', 'FOREST', 'VOLCANO', 'CYBER CITY', 'FANTASY', 'CRYSTAL', 'ENERGY', 'ABSTRACT', 'MIXED'];
      effectiveType = rng.choice(types);
    } else if (directives.suggestedWorldType && worldType === 'MIXED') {
      effectiveType = directives.suggestedWorldType;
    }

    // 2. Select Biome & Terrain
    let biome: BiomeType = 'living-forest';
    let terrainType: BrainDecisions['terrainType'] = 'rolling-hills';
    let liquidType: BrainDecisions['liquidType'] = 'none';
    let structureType: BrainDecisions['structureType'] = 'none';
    let defaultParticleType: BrainDecisions['particleType'] = 'dust';

    switch (effectiveType) {
      case 'SPACE':
        biome = 'space-city';
        terrainType = 'floating-rocks';
        liquidType = 'none';
        structureType = directives.features.hasPortal ? 'portals' : 'none';
        defaultParticleType = 'cosmic';
        break;

      case 'OCEAN':
        biome = directives.recognizedKeywords.includes('underwater') ? 'underwater-world' : 'ocean-world';
        terrainType = 'canyons';
        liquidType = 'water';
        structureType = 'none';
        defaultParticleType = 'bubbles';
        break;

      case 'MOUNTAIN':
        biome = directives.features.hasClouds ? 'mountain-clouds' : 'mountain-world';
        terrainType = 'mountains';
        liquidType = 'none';
        structureType = 'floating-islands';
        defaultParticleType = directives.features.hasSnow ? 'snow' : 'dust';
        break;

      case 'FOREST':
        biome = directives.recognizedKeywords.includes('bamboo') ? 'bamboo-forest' : 'living-forest';
        terrainType = 'rolling-hills';
        liquidType = 'water';
        structureType = 'trees';
        defaultParticleType = 'spores';
        break;

      case 'VOLCANO':
        biome = directives.features.hasLava ? 'lava-flow' : 'volcano-world';
        terrainType = 'canyons';
        liquidType = 'lava';
        structureType = 'none';
        defaultParticleType = 'sparks';
        break;

      case 'CYBER CITY':
        biome = directives.recognizedKeywords.includes('highway') ? 'neon-highway' : 'cyber-city';
        terrainType = 'cyber-grid';
        liquidType = 'none';
        structureType = 'skyscrapers';
        defaultParticleType = 'cyber';
        break;

      case 'CRYSTAL':
        biome = 'crystal-world';
        terrainType = 'floating-rocks';
        liquidType = 'crystals';
        structureType = 'crystals';
        defaultParticleType = 'sparks';
        break;

      case 'ENERGY':
        biome = directives.recognizedKeywords.includes('lightning') ? 'lightning-world' : 'energy-world';
        terrainType = 'cyber-grid';
        liquidType = 'plasma';
        structureType = 'none';
        defaultParticleType = 'sparks';
        break;

      case 'FANTASY':
        biome = directives.features.hasPortal ? 'portal-world' : 'floating-islands';
        terrainType = 'floating-rocks';
        liquidType = 'water';
        structureType = directives.features.hasPortal ? 'portals' : 'floating-islands';
        defaultParticleType = 'spores';
        break;

      case 'ABSTRACT':
        biome = 'fractal-world';
        terrainType = 'fractal';
        liquidType = 'none';
        structureType = 'fractals';
        defaultParticleType = 'cosmic';
        break;

      case 'MIXED':
        biome = directives.suggestedBiome || rng.choice(['aurora-world', 'space-city', 'floating-islands', 'hologram-city']);
        terrainType = 'floating-rocks';
        liquidType = 'water';
        structureType = 'crystals';
        defaultParticleType = 'spores';
        break;

      case 'NATURE':
      default:
        biome = directives.features.hasSnow ? 'snow-world' : 'tropical-world';
        terrainType = 'rolling-hills';
        liquidType = 'water';
        structureType = 'trees';
        defaultParticleType = directives.features.hasSnow ? 'snow' : 'dust';
        break;
    }

    // Prompt overrides
    if (directives.suggestedBiome) {
      biome = directives.suggestedBiome;
    }
    if (directives.features.hasLava) {
      liquidType = 'lava';
      defaultParticleType = 'sparks';
    }
    if (directives.features.hasCrystals) {
      structureType = 'crystals';
    }
    if (directives.features.hasPortal) {
      structureType = 'portals';
    }

    // 3. Weather determination
    let weatherType: WeatherType = 'clear';
    if (directives.suggestedWeather) {
      weatherType = directives.suggestedWeather;
    } else {
      switch (atmosphere) {
        case 'STORMY':
          weatherType = effectiveType === 'SPACE' ? 'cosmic-dust' as any : 'storm';
          break;
        case 'COSMIC':
          weatherType = 'aurora';
          break;
        case 'DEEP':
          weatherType = 'fog';
          break;
        case 'ENERGETIC':
          weatherType = effectiveType === 'VOLCANO' ? 'embers' : 'spores';
          break;
        case 'DREAMLIKE':
          weatherType = 'aurora';
          break;
        default:
          weatherType = 'clear';
          break;
      }
    }

    if (directives.features.hasSnow) weatherType = 'snow';
    if (directives.features.hasAurora) weatherType = 'aurora';

    let weatherIntensity = atmosphere === 'STORMY' ? 1.5 : atmosphere === 'DYNAMIC' ? 1.1 : 0.6;
    let windSpeed = atmosphere === 'STORMY' ? 3.0 : atmosphere === 'DYNAMIC' ? 1.8 : 0.8;
    let cloudDensity = directives.features.hasClouds ? 0.8 : atmosphere === 'STORMY' ? 0.9 : 0.3;

    // 4. Time & Lighting
    let timeOfDay: TimeOfDay = directives.suggestedTime || (
      effectiveType === 'SPACE' || effectiveType === 'CYBER CITY' || aesthetics.amoledBlack
        ? 'night'
        : atmosphere === 'CALM' ? 'dawn' : atmosphere === 'DEEP' ? 'twilight' : 'day'
    );
    let timeCycleSpeed = motion === 'STATIC' ? 0 : motion === 'DYNAMIC' ? 0.04 : 0.015;

    let hasAurora = directives.features.hasAurora || weatherType === 'aurora' || atmosphere === 'COSMIC' || atmosphere === 'DREAMLIKE';
    let hasStars = effectiveType === 'SPACE' || timeOfDay === 'night' || timeOfDay === 'twilight';
    let starDensity = effectiveType === 'SPACE' ? 6000 : 2000;

    let sunIntensity = timeOfDay === 'night' ? 0.2 : timeOfDay === 'sunset' ? 1.4 : 1.1;
    let ambientIntensity = timeOfDay === 'night' ? 0.3 : 0.7;

    // 5. Particles & Performance Scaling
    let particleCount = 2500;
    let particleSpeed = 1.0;
    let particleSize = 1.0;
    let particleTurbulence = 0.8;

    switch (performance) {
      case 'BATTERY SAVER':
        particleCount = 800;
        particleSpeed = 0.7;
        particleSize = 1.2;
        break;
      case 'BALANCED':
        particleCount = 1800;
        particleSpeed = 1.0;
        break;
      case 'HIGH QUALITY':
        particleCount = 3500;
        particleSpeed = 1.2;
        break;
      case 'ULTRA':
        particleCount = 6000;
        particleSpeed = 1.4;
        break;
    }

    if (atmosphere === 'CALM') {
      particleSpeed *= 0.6;
      particleTurbulence = 0.3;
    } else if (atmosphere === 'ENERGETIC' || atmosphere === 'STORMY') {
      particleSpeed *= 1.5;
      particleTurbulence = 1.6;
    }

    // 6. Physics Forces
    let gravity = effectiveType === 'SPACE' ? 0.0 : effectiveType === 'OCEAN' ? 2.5 : 9.8;
    let physicsTurbulence = atmosphere === 'STORMY' ? 1.8 : atmosphere === 'CALM' ? 0.4 : 1.0;
    let interactionStrength = motion === 'DYNAMIC' ? 2.0 : motion === 'SUBTLE' ? 0.8 : motion === 'STATIC' ? 0.1 : 1.4;
    let vortexStrength = directives.features.hasBlackHole || directives.features.hasPortal ? 2.4 : 0.0;

    // 7. Ecosystem (Life Simulation)
    let ecosystemEnabled = (effectiveType === 'FOREST' || effectiveType === 'NATURE' || effectiveType === 'OCEAN' || effectiveType === 'CYBER CITY') && performance !== 'BATTERY SAVER';
    let ecosystemDensity = performance === 'ULTRA' ? 1.5 : 1.0;
    let ecosystemActivity = motion === 'DYNAMIC' ? 1.5 : 0.8;
    let ecosystemEntities: LifeEntityType[] = [];

    if (ecosystemEnabled) {
      if (effectiveType === 'OCEAN') {
        ecosystemEntities = ['fish', 'underwater-creatures'];
      } else if (effectiveType === 'CYBER CITY') {
        ecosystemEntities = ['drones', 'light-traffic'];
      } else if (effectiveType === 'FOREST' || effectiveType === 'NATURE') {
        ecosystemEntities = ['birds', 'butterflies', 'fireflies', 'leaves'];
      } else if (effectiveType === 'VOLCANO') {
        ecosystemEntities = ['volcanic-embers'];
      }
    }

    // 8. Camera Behavior
    let cameraFov = 60;
    let cameraDistance = 35;
    let cameraDrift = motion === 'STATIC' ? 0.0 : motion === 'SUBTLE' ? 0.4 : 1.0;
    let cameraOrbit = motion === 'DYNAMIC' ? 1.3 : 0.6;
    let cameraBehavior: BrainDecisions['cameraBehavior'] = 'cinematic-orbit';

    switch (atmosphere) {
      case 'DREAMLIKE':
        cameraBehavior = 'floating-observer';
        cameraDrift = 0.8;
        break;
      case 'STORMY':
      case 'DYNAMIC':
        cameraBehavior = 'fly-through';
        cameraOrbit = 1.4;
        break;
      case 'CALM':
        cameraBehavior = 'gentle-sway';
        cameraDrift = 0.3;
        break;
      case 'COSMIC':
        cameraBehavior = 'cinematic-orbit';
        cameraDistance = 45;
        break;
      default:
        cameraBehavior = 'dynamic-parallex';
        break;
    }

    // 9. Motion profile
    let motionSensitivity = motion === 'STATIC' ? 0.0 : motion === 'SUBTLE' ? 0.6 : motion === 'DYNAMIC' ? 2.2 : 1.2;
    let touchInteraction = motion !== 'STATIC';
    let parallaxMultiplier = motion === 'DYNAMIC' ? 2.0 : motion === 'SUBTLE' ? 0.7 : 1.2;

    // 10. Audio Reactivity
    let audioEnabled = true;
    let audioSensitivity = atmosphere === 'ENERGETIC' ? 1.8 : 1.2;
    let audioReactiveMode: BrainDecisions['audioReactiveMode'] =
      effectiveType === 'ENERGY' || effectiveType === 'CYBER CITY' ? 'all' :
      effectiveType === 'SPACE' ? 'bloom' : 'motion';

    return {
      effectiveWorldType: effectiveType,
      biome,
      terrainType,
      liquidType,
      structureType,
      weatherType,
      weatherIntensity,
      windSpeed,
      cloudDensity,
      timeOfDay,
      timeCycleSpeed,
      sunIntensity,
      ambientIntensity,
      hasAurora,
      hasStars,
      starDensity,
      particleCount,
      particleSpeed,
      particleSize,
      particleTurbulence,
      particleType: defaultParticleType,
      gravity,
      physicsTurbulence,
      interactionStrength,
      vortexStrength,
      ecosystemEnabled,
      ecosystemDensity,
      ecosystemActivity,
      ecosystemEntities,
      cameraFov,
      cameraDistance,
      cameraDrift,
      cameraOrbit,
      cameraBehavior,
      motionSensitivity,
      touchInteraction,
      parallaxMultiplier,
      audioEnabled,
      audioSensitivity,
      audioReactiveMode
    };
  }
}
