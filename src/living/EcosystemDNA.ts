import { BiomeType } from '../environment/types/environmentDNA';

export type LifeEntityType =
  | 'birds'
  | 'butterflies'
  | 'fish'
  | 'fireflies'
  | 'insects'
  | 'leaves'
  | 'drifting-spores'
  | 'clouds'
  | 'underwater-creatures'
  | 'drones'
  | 'light-traffic'
  | 'volcanic-embers';

export interface EcosystemDNA {
  seed: number;
  enabled: boolean;
  ecosystemEnabled: boolean;
  entityDensity: number; // 0.1 to 2.0 (default 1.0)
  activityLevel: number; // 0.2 to 2.0 (default 1.0)
  movementSpeed: number; // 0.5 to 2.5 (default 1.0)
  flockingStrength: number; // 0 to 2.0 (alignment + cohesion)
  attraction: number; // attraction to points of interest / flora / light
  avoidance: number; // repulsion from obstacles / touch / predator
  weatherResponse: number; // 0 to 1 (how strongly weather dampens/alters activity)
  timeResponse: number; // 0 to 1 (how day/night modulates activity)
  eventFrequency: number; // 0.1 to 3.0 (procedural event frequency modifier)
  particleDensity: number; // 0.2 to 2.0
  motionReaction: number; // 0 to 2.0
  touchReaction: number; // 0 to 2.0
  allowedEntities: LifeEntityType[];
  environmentParams: {
    biomeBias: BiomeType;
    temperature: number; // -1 (freezing) to +1 (scorching)
    humidity: number; // 0 (arid) to 1 (saturated)
    windSensitivity: number;
    lightAffinity: number;
  };
}

export class EcosystemDNAFactory {
  public static createDefault(biome: BiomeType = 'living-forest', seed: number = 42): EcosystemDNA {
    const allowed = EcosystemDNAFactory.getDefaultEntitiesForBiome(biome);

    let temp = 0.2;
    let humidity = 0.7;
    let windSens = 1.0;

    switch (biome) {
      case 'ocean-world':
      case 'underwater-world':
        temp = 0.1;
        humidity = 1.0;
        windSens = 0.4;
        break;
      case 'volcano-world':
        temp = 0.95;
        humidity = 0.05;
        windSens = 0.8;
        break;
      case 'cyber-city':
        temp = 0.3;
        humidity = 0.4;
        windSens = 1.2;
        break;
      case 'snow-world':
        temp = -0.9;
        humidity = 0.5;
        windSens = 1.5;
        break;
      case 'crystal-world':
      case 'floating-islands':
        temp = 0.0;
        humidity = 0.6;
        windSens = 0.9;
        break;
      case 'thunder-storm':
        temp = 0.1;
        humidity = 0.95;
        windSens = 2.0;
        break;
    }

    return {
      seed,
      enabled: true,
      ecosystemEnabled: true,
      entityDensity: 1.0,
      activityLevel: 1.0,
      movementSpeed: 1.0,
      flockingStrength: 1.0,
      attraction: 1.0,
      avoidance: 1.2,
      weatherResponse: 0.85,
      timeResponse: 0.9,
      eventFrequency: 1.0,
      particleDensity: 1.0,
      motionReaction: 1.0,
      touchReaction: 1.2,
      allowedEntities: allowed,
      environmentParams: {
        biomeBias: biome,
        temperature: temp,
        humidity,
        windSensitivity: windSens,
        lightAffinity: 0.8
      }
    };
  }

  public static getDefaultEntitiesForBiome(biome: BiomeType): LifeEntityType[] {
    switch (biome) {
      case 'living-forest':
        return ['birds', 'butterflies', 'insects', 'leaves', 'fireflies'];
      case 'ocean-world':
        return ['fish', 'underwater-creatures', 'drifting-spores', 'clouds'];
      case 'underwater-world':
        return ['fish', 'underwater-creatures', 'drifting-spores'];
      case 'volcano-world':
        return ['volcanic-embers', 'drifting-spores', 'clouds'];
      case 'cyber-city':
        return ['drones', 'light-traffic', 'drifting-spores'];
      case 'snow-world':
        return ['birds', 'clouds', 'drifting-spores'];
      case 'aurora-world':
        return ['birds', 'fireflies', 'drifting-spores', 'clouds'];
      case 'crystal-world':
        return ['fireflies', 'butterflies', 'drifting-spores'];
      case 'floating-islands':
        return ['birds', 'butterflies', 'clouds', 'leaves'];
      case 'thunder-storm':
        return ['clouds', 'birds', 'drifting-spores'];
      default:
        return ['birds', 'butterflies', 'fireflies', 'leaves'];
    }
  }

  public static randomize(seed: number = Math.floor(Math.random() * 999999), biome: BiomeType = 'living-forest'): EcosystemDNA {
    const base = EcosystemDNAFactory.createDefault(biome, seed);
    // Deterministic pseudo-random variation based on seed
    const pseudo = (offset: number) => {
      const s = Math.sin(seed + offset) * 10000;
      return s - Math.floor(s);
    };

    base.entityDensity = 0.5 + pseudo(1) * 1.0;
    base.activityLevel = 0.6 + pseudo(2) * 0.9;
    base.movementSpeed = 0.7 + pseudo(3) * 0.8;
    base.flockingStrength = 0.4 + pseudo(4) * 1.2;
    base.eventFrequency = 0.5 + pseudo(5) * 1.2;
    base.particleDensity = 0.6 + pseudo(6) * 0.9;
    base.touchReaction = 0.8 + pseudo(7) * 0.7;
    base.motionReaction = 0.7 + pseudo(8) * 0.6;
    return base;
  }

  public static clone(dna: EcosystemDNA): EcosystemDNA {
    return JSON.parse(JSON.stringify(dna));
  }
}
