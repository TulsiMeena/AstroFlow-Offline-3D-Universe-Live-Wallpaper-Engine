import {
  WorldType,
  WorldStyle,
  WorldAtmosphere,
  WorldMotion,
  WorldPerformance,
  VariationModifier,
  PersonalWorld,
  UniverseRecipe
} from './types';
import { UniverseRecipeEngine } from './UniverseRecipeEngine';
import { UniverseDNAComposer } from './UniverseDNAComposer';
import { RandomUniverseEngine } from './RandomUniverseEngine';
import { UniverseVariationEngine } from './UniverseVariationEngine';
import { PersonalPresetManager } from './PersonalPresetManager';
import { WallpaperRegistry } from '../engine/WallpaperRegistry';
import { PersonalUniverseWallpaper } from '../wallpapers/PersonalUniverseWallpaper';
import { WallpaperEngine } from '../engine/WallpaperEngine';

export class PersonalUniverseGenerator {
  private static instance: PersonalUniverseGenerator;

  private constructor() {}

  public static getInstance(): PersonalUniverseGenerator {
    if (!PersonalUniverseGenerator.instance) {
      PersonalUniverseGenerator.instance = new PersonalUniverseGenerator();
    }
    return PersonalUniverseGenerator.instance;
  }

  /**
   * Generates a unique, deterministic personal world from simple choices.
   */
  public generateWorld(options: {
    worldType: WorldType;
    style: WorldStyle;
    atmosphere: WorldAtmosphere;
    motion: WorldMotion;
    performance: WorldPerformance;
    seed?: string;
    customPrompt?: string;
    name?: string;
  }): PersonalWorld {
    const recipe = UniverseRecipeEngine.createRecipe(options);
    return UniverseDNAComposer.compose(recipe);
  }

  /**
   * Generates a completely new random universe.
   */
  public createRandomWorld(): PersonalWorld {
    const recipe = RandomUniverseEngine.createRandomUniverse();
    return UniverseDNAComposer.compose(recipe);
  }

  /**
   * Generates a curated, synergistically compatible "Surprise Me" world.
   */
  public createSurpriseMeWorld(): PersonalWorld {
    const recipe = RandomUniverseEngine.createSurpriseMe();
    return UniverseDNAComposer.compose(recipe);
  }

  /**
   * Generates a deterministic variation (1 through 4) of an existing world.
   */
  public createVariation(world: PersonalWorld, index: 1 | 2 | 3 | 4): PersonalWorld {
    const varRecipe = UniverseVariationEngine.createVariation(world.recipe, index);
    return UniverseDNAComposer.compose(varRecipe);
  }

  /**
   * Applies a directional modifier (e.g. MORE COSMIC, MORE CALM, etc.).
   */
  public applyModifier(world: PersonalWorld, modifier: VariationModifier): PersonalWorld {
    const modRecipe = UniverseVariationEngine.applyModifier(world.recipe, modifier);
    return UniverseDNAComposer.compose(modRecipe);
  }

  /**
   * Saves world to local storage.
   */
  public saveWorld(world: PersonalWorld): boolean {
    return PersonalPresetManager.saveWorld(world);
  }

  /**
   * Gets all saved worlds.
   */
  public getAllSavedWorlds(): PersonalWorld[] {
    return PersonalPresetManager.getAllWorlds();
  }

  /**
   * Renames a saved world.
   */
  public renameWorld(id: string, newName: string): boolean {
    return PersonalPresetManager.renameWorld(id, newName);
  }

  /**
   * Duplicates a saved world.
   */
  public duplicateWorld(id: string): PersonalWorld | null {
    return PersonalPresetManager.duplicateWorld(id);
  }

  /**
   * Deletes a world from storage.
   */
  public deleteWorld(id: string): boolean {
    return PersonalPresetManager.deleteWorld(id);
  }

  /**
   * Toggles favorite state.
   */
  public toggleFavorite(id: string): boolean {
    return PersonalPresetManager.toggleFavorite(id);
  }

  /**
   * Exports safe, shareable World Code string.
   */
  public exportWorldCode(world: PersonalWorld): string {
    return PersonalPresetManager.exportWorldCode(world);
  }

  /**
   * Validates and imports a World Code string.
   */
  public importWorldCode(codeString: string): PersonalWorld | null {
    return PersonalPresetManager.importWorldCode(codeString);
  }

  /**
   * Registers the generated PersonalWorld into the wallpaper registry
   * and triggers the engine switch without reloading the page.
   */
  public applyWorldToEngine(
    world: PersonalWorld,
    switchWallpaper: (id: string) => void,
    engine?: WallpaperEngine | null
  ): void {
    const registry = WallpaperRegistry.getInstance();
    const wallpaperId = `personal-universe-${world.id}`;

    // Register factory in runtime registry
    registry.register(wallpaperId, () => new PersonalUniverseWallpaper(world));

    // Save active id in preset manager
    PersonalPresetManager.setActiveWorldId(world.id);

    // Switch wallpaper immediately
    switchWallpaper(wallpaperId);

    // Configure live engine subsystems if available
    if (engine) {
      // Configure motion sensitivity
      engine.setMotionSensitivity(world.recipe.motionProfile.sensitivity);

      // Configure cinematic camera orbit if dynamic
      const cinematicEngine = engine.getCinematicEngine();
      if (cinematicEngine && world.recipe.camera.behavior === 'cinematic-orbit') {
        cinematicEngine.setPreset('cinematic');
      }

      // Configure physics gravity strength
      const physicsEngine = engine.getPhysicsEngine();
      if (physicsEngine && physicsEngine.gravity) {
        physicsEngine.gravity.setStrength(Math.min(2.0, Math.abs(world.recipe.physics.gravity) / 5));
      }
    }
  }
}
