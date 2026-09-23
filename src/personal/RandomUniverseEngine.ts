import {
  WorldType,
  WorldStyle,
  WorldAtmosphere,
  WorldMotion,
  WorldPerformance,
  UniverseRecipe
} from './types';
import { UniverseRecipeEngine } from './UniverseRecipeEngine';

interface ArchetypeSynergy {
  title: string;
  prompt: string;
  worldType: WorldType;
  style: WorldStyle;
  atmosphere: WorldAtmosphere;
  motion: WorldMotion;
}

export class RandomUniverseEngine {
  private static readonly COMPATIBLE_SYNERGIES: ArchetypeSynergy[] = [
    {
      title: 'Ocean Aurora Tempest',
      prompt: 'Ocean rain aurora glowing waves',
      worldType: 'OCEAN',
      style: 'CINEMATIC',
      atmosphere: 'COSMIC',
      motion: 'DYNAMIC'
    },
    {
      title: 'Boreal Frost Sanctuary',
      prompt: 'Forest snow aurora glowing trees',
      worldType: 'FOREST',
      style: 'MYSTICAL',
      atmosphere: 'CALM',
      motion: 'SUBTLE'
    },
    {
      title: 'Glacial Caldera',
      prompt: 'Volcano snow mountains red sky lava',
      worldType: 'VOLCANO',
      style: 'REALISTIC-STYLE',
      atmosphere: 'STORMY',
      motion: 'BALANCED'
    },
    {
      title: 'Cyber City Storm',
      prompt: 'Cyber city neon roads rain storm',
      worldType: 'CYBER CITY',
      style: 'NEON',
      atmosphere: 'STORMY',
      motion: 'DYNAMIC'
    },
    {
      title: 'Singularity Drift',
      prompt: 'Galaxy with a giant black hole and glowing planets stars',
      worldType: 'SPACE',
      style: 'AMOLED',
      atmosphere: 'COSMIC',
      motion: 'BALANCED'
    },
    {
      title: 'Quantum Prismatic Nexus',
      prompt: 'Crystal energy floating fractal shards',
      worldType: 'CRYSTAL',
      style: 'FUTURISTIC',
      atmosphere: 'ENERGETIC',
      motion: 'DYNAMIC'
    },
    {
      title: 'Aetheria Dimensional Gate',
      prompt: 'Desert sand portal cosmic vortex clouds',
      worldType: 'FANTASY',
      style: 'MYSTICAL',
      atmosphere: 'DREAMLIKE',
      motion: 'BALANCED'
    },
    {
      title: 'Highland Stratosphere',
      prompt: 'Mountain clouds misty peaks sunset',
      worldType: 'MOUNTAIN',
      style: 'PEACEFUL',
      atmosphere: 'CALM',
      motion: 'SUBTLE'
    },
    {
      title: 'Bioluminescent Abyss',
      prompt: 'Underwater deep ocean bioluminescent particles',
      worldType: 'OCEAN',
      style: 'DREAM',
      atmosphere: 'DEEP',
      motion: 'SUBTLE'
    },
    {
      title: 'Stellar Liquid Exoplanet',
      prompt: 'Space ocean stars nebulae planetary waves',
      worldType: 'SPACE',
      style: 'CINEMATIC',
      atmosphere: 'COSMIC',
      motion: 'BALANCED'
    }
  ];

  /**
   * Generates a completely new random universe recipe.
   */
  public static createRandomUniverse(): UniverseRecipe {
    const worldTypes: WorldType[] = ['SPACE', 'NATURE', 'OCEAN', 'MOUNTAIN', 'FOREST', 'VOLCANO', 'CYBER CITY', 'FANTASY', 'CRYSTAL', 'ENERGY', 'ABSTRACT', 'MIXED'];
    const styles: WorldStyle[] = ['REALISTIC-STYLE', 'CINEMATIC', 'FUTURISTIC', 'DREAM', 'DARK', 'AMOLED', 'NEON', 'MYSTICAL', 'MINIMAL', 'CHAOTIC', 'PEACEFUL'];
    const atmospheres: WorldAtmosphere[] = ['CALM', 'DYNAMIC', 'STORMY', 'MYSTERIOUS', 'ENERGETIC', 'DREAMLIKE', 'COSMIC', 'DEEP'];
    const motions: WorldMotion[] = ['STATIC', 'SUBTLE', 'BALANCED', 'DYNAMIC'];
    const perfs: WorldPerformance[] = ['BALANCED', 'HIGH QUALITY', 'ULTRA'];

    const chosenType = worldTypes[Math.floor(Math.random() * worldTypes.length)];
    const chosenStyle = styles[Math.floor(Math.random() * styles.length)];
    const chosenAtmo = atmospheres[Math.floor(Math.random() * atmospheres.length)];
    const chosenMotion = motions[Math.floor(Math.random() * motions.length)];
    const chosenPerf = perfs[Math.floor(Math.random() * perfs.length)];

    const seed = UniverseRecipeEngine.generateSeedString();

    return UniverseRecipeEngine.createRecipe({
      worldType: chosenType,
      style: chosenStyle,
      atmosphere: chosenAtmo,
      motion: chosenMotion,
      performance: chosenPerf,
      seed,
      name: `Random ${chosenType} Cosmos [${seed}]`
    });
  }

  /**
   * Generates a curated, synergistically compatible "Surprise Me" world recipe.
   * Explicitly avoids technical incompatibilities (e.g. lava underwater with blizzard without steam/bubble archetype).
   */
  public static createSurpriseMe(): UniverseRecipe {
    const synergy = this.COMPATIBLE_SYNERGIES[Math.floor(Math.random() * this.COMPATIBLE_SYNERGIES.length)];
    const seed = UniverseRecipeEngine.generateSeedString();

    return UniverseRecipeEngine.createRecipe({
      worldType: synergy.worldType,
      style: synergy.style,
      atmosphere: synergy.atmosphere,
      motion: synergy.motion,
      performance: 'HIGH QUALITY',
      customPrompt: synergy.prompt,
      seed,
      name: `${synergy.title} [${seed}]`
    });
  }
}
