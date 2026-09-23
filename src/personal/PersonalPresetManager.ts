import { PersonalWorld, UniverseRecipe } from './types';
import { UniverseDNAComposer } from './UniverseDNAComposer';
import { UniverseRecipeEngine } from './UniverseRecipeEngine';

const STORAGE_KEY_PERSONAL_WORLDS = 'amit_hyperwall_personal_worlds';
const STORAGE_KEY_ACTIVE_PERSONAL_WORLD_ID = 'amit_hyperwall_active_personal_world_id';
const CODE_PREFIX = 'HW-UNIVERSE-v1:';

export class PersonalPresetManager {
  /**
   * Retrieves all saved personal worlds from local storage.
   */
  public static getAllWorlds(): PersonalWorld[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PERSONAL_WORLDS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(w => w && w.id && w.seed && w.recipe);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved personal worlds from localStorage', e);
    }
    return [];
  }

  /**
   * Saves or updates a personal world in local storage.
   */
  public static saveWorld(world: PersonalWorld): boolean {
    try {
      const list = this.getAllWorlds();
      const index = list.findIndex(w => w.id === world.id);
      if (index >= 0) {
        list[index] = { ...world, lastModified: Date.now() };
      } else {
        list.unshift({ ...world, lastModified: Date.now() });
      }
      localStorage.setItem(STORAGE_KEY_PERSONAL_WORLDS, JSON.stringify(list));
      return true;
    } catch (e) {
      console.error('Failed to save personal world to localStorage', e);
      return false;
    }
  }

  /**
   * Retrieves a single world by ID.
   */
  public static getWorld(id: string): PersonalWorld | null {
    const list = this.getAllWorlds();
    return list.find(w => w.id === id) || null;
  }

  /**
   * Renames a saved world.
   */
  public static renameWorld(id: string, newName: string): boolean {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const list = this.getAllWorlds();
    const item = list.find(w => w.id === id);
    if (!item) return false;
    item.name = trimmed;
    item.recipe.name = trimmed;
    item.lastModified = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_PERSONAL_WORLDS, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Duplicates a saved world with a distinct ID and seed copy.
   */
  public static duplicateWorld(id: string): PersonalWorld | null {
    const original = this.getWorld(id);
    if (!original) return null;

    const copySeed = `${original.seed}-COPY`;
    const copyRecipe: UniverseRecipe = {
      ...original.recipe,
      id: `recipe_${Date.now()}`,
      name: `${original.name} (Copy)`,
      seed: copySeed,
      numericSeed: UniverseRecipeEngine.hashSeedToNumber(copySeed),
      createdAt: Date.now()
    };

    const duplicate = UniverseDNAComposer.compose(copyRecipe);
    this.saveWorld(duplicate);
    return duplicate;
  }

  /**
   * Deletes a world by ID.
   */
  public static deleteWorld(id: string): boolean {
    try {
      const list = this.getAllWorlds().filter(w => w.id !== id);
      localStorage.setItem(STORAGE_KEY_PERSONAL_WORLDS, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Toggles favorite flag for a world.
   */
  public static toggleFavorite(id: string): boolean {
    const list = this.getAllWorlds();
    const item = list.find(w => w.id === id);
    if (!item) return false;
    item.isFavorite = !item.isFavorite;
    item.lastModified = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_PERSONAL_WORLDS, JSON.stringify(list));
      return item.isFavorite;
    } catch (e) {
      return false;
    }
  }

  /**
   * Sets the active personal world ID in storage.
   */
  public static setActiveWorldId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PERSONAL_WORLD_ID, id);
    } catch (e) {
      // safe fallback
    }
  }

  /**
   * Gets the active personal world ID.
   */
  public static getActiveWorldId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_ACTIVE_PERSONAL_WORLD_ID);
    } catch (e) {
      return null;
    }
  }

  /**
   * Exports a compact, safe, shareable World Code string (Base64 encoded JSON).
   */
  public static exportWorldCode(world: PersonalWorld): string {
    const payload = {
      v: 1,
      name: world.name,
      seed: world.seed,
      wt: world.recipe.worldType,
      st: world.recipe.style,
      at: world.recipe.atmosphere,
      mo: world.recipe.motion,
      pf: world.recipe.performance,
      prompt: world.recipe.customPrompt || ''
    };
    try {
      const jsonStr = JSON.stringify(payload);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      return `${CODE_PREFIX}${b64}`;
    } catch (e) {
      return `${CODE_PREFIX}${JSON.stringify(payload)}`;
    }
  }

  /**
   * Safely imports and validates a World Code string.
   * Rejects malicious input, executable code, prototype pollution, or invalid fields.
   */
  public static importWorldCode(rawInput: string): PersonalWorld | null {
    if (!rawInput || typeof rawInput !== 'string') return null;

    const trimmed = rawInput.trim();
    let jsonContent = '';

    if (trimmed.startsWith(CODE_PREFIX)) {
      const encoded = trimmed.substring(CODE_PREFIX.length);
      try {
        jsonContent = decodeURIComponent(escape(atob(encoded)));
      } catch (e) {
        // Fallback: try raw JSON if not valid base64
        jsonContent = encoded;
      }
    } else {
      jsonContent = trimmed;
    }

    try {
      const parsed = JSON.parse(jsonContent);

      // Strict validation against expected schema
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return null;
      }

      // Block prototype pollution
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        console.warn('Rejected potentially malicious World Code containing forbidden object keys');
        return null;
      }

      const seed = typeof parsed.seed === 'string' && parsed.seed.length <= 64 ? parsed.seed : UniverseRecipeEngine.generateSeedString();
      const name = typeof parsed.name === 'string' && parsed.name.length <= 80 ? parsed.name : `Imported Cosmos [${seed}]`;

      // Validate enums strictly
      const validWorldTypes = ['SPACE', 'NATURE', 'OCEAN', 'MOUNTAIN', 'FOREST', 'VOLCANO', 'CYBER CITY', 'FANTASY', 'CRYSTAL', 'ENERGY', 'ABSTRACT', 'MIXED', 'RANDOM'];
      const validStyles = ['REALISTIC-STYLE', 'CINEMATIC', 'FUTURISTIC', 'DREAM', 'DARK', 'AMOLED', 'NEON', 'MYSTICAL', 'MINIMAL', 'CHAOTIC', 'PEACEFUL'];
      const validAtmos = ['CALM', 'DYNAMIC', 'STORMY', 'MYSTERIOUS', 'ENERGETIC', 'DREAMLIKE', 'COSMIC', 'DEEP'];
      const validMotions = ['STATIC', 'SUBTLE', 'BALANCED', 'DYNAMIC'];
      const validPerfs = ['BATTERY SAVER', 'BALANCED', 'HIGH QUALITY', 'ULTRA'];

      const worldType = validWorldTypes.includes(parsed.wt) ? parsed.wt : 'SPACE';
      const style = validStyles.includes(parsed.st) ? parsed.st : 'CINEMATIC';
      const atmosphere = validAtmos.includes(parsed.at) ? parsed.at : 'COSMIC';
      const motion = validMotions.includes(parsed.mo) ? parsed.mo : 'BALANCED';
      const performance = validPerfs.includes(parsed.pf) ? parsed.pf : 'HIGH QUALITY';
      const customPrompt = typeof parsed.prompt === 'string' && parsed.prompt.length <= 300 ? parsed.prompt : undefined;

      // Re-compose recipe deterministically
      const recipe = UniverseRecipeEngine.createRecipe({
        worldType,
        style,
        atmosphere,
        motion,
        performance,
        seed,
        customPrompt,
        name
      });

      return UniverseDNAComposer.compose(recipe);
    } catch (e) {
      console.warn('Failed to import and validate World Code:', e);
      return null;
    }
  }
}
