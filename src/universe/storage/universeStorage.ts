import { WorldDNA, SavedUniverse } from '../types/worldDNA';
import { UniverseSeedEngine } from '../seed/UniverseSeedEngine';

const STORAGE_KEY_ACTIVE_DNA = 'amit_hyperwall_active_dna';
const STORAGE_KEY_SAVED_UNIVERSES = 'amit_hyperwall_saved_universes';
const STORAGE_KEY_RECENT_SEEDS = 'amit_hyperwall_recent_seeds';

export class UniverseStorage {
  public static getActiveDNA(): WorldDNA {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_DNA);
      if (raw) {
        const parsed = JSON.parse(raw);
        return UniverseSeedEngine.sanitizeDNA(parsed);
      }
    } catch (e) {
      console.warn('Failed to read active DNA from storage, using default', e);
    }
    return UniverseSeedEngine.getPresets()[0].dna;
  }

  public static setActiveDNA(dna: WorldDNA): void {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_DNA, JSON.stringify(dna));
      UniverseStorage.addRecentSeed(dna.seed);
    } catch (e) {
      console.error('Failed to save active DNA to storage', e);
    }
  }

  public static getSavedUniverses(): SavedUniverse[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SAVED_UNIVERSES);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Failed to load saved universes', e);
    }
    // Return default initial list containing default presets
    return UniverseSeedEngine.getPresets().map(p => ({
      id: p.id,
      name: p.name,
      seed: p.dna.seed,
      createdAt: Date.now(),
      dna: p.dna,
      notes: p.description
    }));
  }

  public static saveUniverse(name: string, dna: WorldDNA, notes?: string): SavedUniverse {
    const list = UniverseStorage.getSavedUniverses();
    const newEntry: SavedUniverse = {
      id: `univ_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim() || `Universe ${dna.seed}`,
      seed: dna.seed,
      createdAt: Date.now(),
      dna,
      notes
    };
    list.unshift(newEntry);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_UNIVERSES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save universe to storage', e);
    }
    return newEntry;
  }

  public static deleteSavedUniverse(id: string): void {
    const list = UniverseStorage.getSavedUniverses().filter(u => u.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_UNIVERSES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to delete universe', e);
    }
  }

  public static getRecentSeeds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RECENT_SEEDS);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return ['ANDROMEDA-7700-SPIRAL', 'VOID-9000-SINGULARITY', 'SOLAR-4200-DOMINION'];
  }

  public static addRecentSeed(seed: string): void {
    if (!seed) return;
    try {
      let seeds = UniverseStorage.getRecentSeeds();
      seeds = [seed, ...seeds.filter(s => s !== seed)].slice(0, 10);
      localStorage.setItem(STORAGE_KEY_RECENT_SEEDS, JSON.stringify(seeds));
    } catch {
      // ignore
    }
  }
}
