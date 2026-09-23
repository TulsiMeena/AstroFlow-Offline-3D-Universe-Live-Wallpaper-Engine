import { EnvironmentDNA, WeatherType } from '../environment/types/environmentDNA';
import { EcosystemDNA, EcosystemDNAFactory } from './EcosystemDNA';
import { EnvironmentDNAFactory } from '../environment/EnvironmentDNA';

export interface SavedWorldPreset {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  seed: number;
  environmentDNA: EnvironmentDNA;
  ecosystemDNA: EcosystemDNA;
  timeHour: number;
  weatherType: WeatherType;
  tags: string[];
}

export class WorldStateManager {
  private static STORAGE_KEY = 'amit_hyperwall_living_worlds_v1';
  private static ACTIVE_WORLD_KEY = 'amit_hyperwall_active_living_world_v1';

  private static instance: WorldStateManager | null = null;

  public static getInstance(): WorldStateManager {
    if (!WorldStateManager.instance) {
      WorldStateManager.instance = new WorldStateManager();
    }
    return WorldStateManager.instance;
  }

  private savedWorlds: SavedWorldPreset[] = [];

  constructor() {
    this.loadFromStorage();
    if (this.savedWorlds.length === 0) {
      this.populateCuratedDefaults();
    }
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(WorldStateManager.STORAGE_KEY);
      if (raw) {
        this.savedWorlds = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('LocalStorage unavailable for WorldStateManager, operating in memory', err);
    }
  }

  private persist() {
    try {
      localStorage.setItem(WorldStateManager.STORAGE_KEY, JSON.stringify(this.savedWorlds));
    } catch (err) {
      console.warn('Failed to persist WorldStateManager to localStorage', err);
    }
  }

  public getAllSavedWorlds(): SavedWorldPreset[] {
    return [...this.savedWorlds];
  }

  public getWorldById(id: string): SavedWorldPreset | undefined {
    return this.savedWorlds.find((w) => w.id === id);
  }

  public saveWorld(
    name: string,
    environmentDNA: EnvironmentDNA,
    ecosystemDNA: EcosystemDNA,
    timeHour: number = 12.0,
    weatherType: WeatherType = 'clear',
    description: string = 'Custom procedural living world.'
  ): SavedWorldPreset {
    const id = `world-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const preset: SavedWorldPreset = {
      id,
      name,
      description,
      createdAt: Date.now(),
      seed: environmentDNA.seed || ecosystemDNA.seed,
      environmentDNA,
      ecosystemDNA,
      timeHour,
      weatherType,
      tags: [environmentDNA.biome, 'living-world', 'procedural']
    };

    this.savedWorlds.unshift(preset);
    this.persist();
    return preset;
  }

  public deleteWorld(id: string): boolean {
    const initialLen = this.savedWorlds.length;
    this.savedWorlds = this.savedWorlds.filter((w) => w.id !== id);
    if (this.savedWorlds.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public saveActiveState(envDNA: EnvironmentDNA, ecoDNA: EcosystemDNA, hour: number) {
    try {
      const state = {
        seed: envDNA.seed,
        envDNA,
        ecoDNA,
        timeHour: hour,
        timestamp: Date.now()
      };
      localStorage.setItem(WorldStateManager.ACTIVE_WORLD_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }

  public getActiveState(): { envDNA: EnvironmentDNA; ecoDNA: EcosystemDNA; timeHour: number } | null {
    try {
      const raw = localStorage.getItem(WorldStateManager.ACTIVE_WORLD_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  private populateCuratedDefaults() {
    // 1. Twilight Firefly Sanctuary
    const forestDNA = EnvironmentDNAFactory.getPresetByBiome('living-forest', 777);
    forestDNA.timeOfDay = 'twilight';
    forestDNA.atmosphere.fogColor = '#0b1626';
    const forestEco = EcosystemDNAFactory.createDefault('living-forest', 777);
    forestEco.allowedEntities = ['fireflies', 'birds', 'leaves', 'insects'];
    forestEco.activityLevel = 1.3;
    forestEco.entityDensity = 1.4;

    this.savedWorlds.push({
      id: 'curated-twilight-sanctuary',
      name: 'Twilight Firefly Sanctuary',
      description: 'Luminescent fireflies weaving through dense twilight canopies with gentle wind sway.',
      createdAt: Date.now(),
      seed: 777,
      environmentDNA: forestDNA,
      ecosystemDNA: forestEco,
      timeHour: 20.2,
      weatherType: 'fog',
      tags: ['living-forest', 'fireflies', 'twilight']
    });

    // 2. Midnight Cyber Metropolis
    const cyberDNA = EnvironmentDNAFactory.getPresetByBiome('cyber-city', 888);
    cyberDNA.timeOfDay = 'night';
    const cyberEco = EcosystemDNAFactory.createDefault('cyber-city', 888);
    cyberEco.allowedEntities = ['drones', 'light-traffic', 'drifting-spores'];
    cyberEco.activityLevel = 1.4;

    this.savedWorlds.push({
      id: 'curated-cyber-metropolis',
      name: 'Midnight Cyber Metropolis',
      description: 'Futuristic highway traffic trails and surveillance hover-drones soaring over neon monoliths.',
      createdAt: Date.now(),
      seed: 888,
      environmentDNA: cyberDNA,
      ecosystemDNA: cyberEco,
      timeHour: 23.5,
      weatherType: 'clear',
      tags: ['cyber-city', 'drones', 'night']
    });

    // 3. Volcanic Pyre & Molten Embers
    const volcanoDNA = EnvironmentDNAFactory.getPresetByBiome('volcano-world', 999);
    const volcanoEco = EcosystemDNAFactory.createDefault('volcano-world', 999);
    volcanoEco.allowedEntities = ['volcanic-embers', 'drifting-spores', 'clouds'];
    volcanoEco.activityLevel = 1.5;

    this.savedWorlds.push({
      id: 'curated-volcanic-pyre',
      name: 'Volcanic Pyre & Embers',
      description: 'Active magma flows with convective updrafts launching superheated glowing volcanic embers.',
      createdAt: Date.now(),
      seed: 999,
      environmentDNA: volcanoDNA,
      ecosystemDNA: volcanoEco,
      timeHour: 19.0,
      weatherType: 'embers',
      tags: ['volcano-world', 'embers', 'elements']
    });

    // 4. Azure Ocean & Marine Schooling
    const oceanDNA = EnvironmentDNAFactory.getPresetByBiome('ocean-world', 444);
    const oceanEco = EcosystemDNAFactory.createDefault('ocean-world', 444);
    oceanEco.allowedEntities = ['fish', 'underwater-creatures', 'clouds'];

    this.savedWorlds.push({
      id: 'curated-ocean-schooling',
      name: 'Azure Ocean & Coral Shoals',
      description: 'Synchronized schooling fish and drifting oceanic creatures swimming above undulating sea beds.',
      createdAt: Date.now(),
      seed: 444,
      environmentDNA: oceanDNA,
      ecosystemDNA: oceanEco,
      timeHour: 14.0,
      weatherType: 'clear',
      tags: ['ocean-world', 'fish', 'nature']
    });

    this.persist();
  }
}
