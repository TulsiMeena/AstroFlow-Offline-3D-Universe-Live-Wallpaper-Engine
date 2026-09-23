import { EnvironmentDNA, EnvironmentPreset, BiomeCategory, BiomeType } from './types/environmentDNA';
import { EnvironmentDNAFactory } from './EnvironmentDNA';

export class EnvironmentRegistry {
  private static instance: EnvironmentRegistry;
  private presets: Map<string, EnvironmentPreset> = new Map();
  private customPresets: Map<string, EnvironmentPreset> = new Map();

  private constructor() {
    this.initBuiltinPresets();
    this.loadCustomPresets();
  }

  public static getInstance(): EnvironmentRegistry {
    if (!EnvironmentRegistry.instance) {
      EnvironmentRegistry.instance = new EnvironmentRegistry();
    }
    return EnvironmentRegistry.instance;
  }

  private initBuiltinPresets() {
    const biomes: { biome: BiomeType; tags: string[] }[] = [
      // NATURE
      { biome: 'ocean-world', tags: ['ocean', 'water', 'waves', 'nature'] },
      { biome: 'underwater-world', tags: ['underwater', 'deep-sea', 'bubbles', 'nature'] },
      { biome: 'living-forest', tags: ['forest', 'trees', 'green', 'leaves', 'nature'] },
      { biome: 'bamboo-forest', tags: ['bamboo', 'zen', 'wind', 'nature'] },
      { biome: 'mountain-world', tags: ['mountains', 'peaks', 'highlands', 'nature'] },
      { biome: 'mountain-clouds', tags: ['mountains', 'clouds', 'fog', 'sky'] },
      { biome: 'waterfall-world', tags: ['waterfall', 'canyon', 'river', 'nature'] },
      { biome: 'tropical-world', tags: ['tropical', 'oasis', 'islands', 'nature'] },
      { biome: 'desert-oasis', tags: ['desert', 'dunes', 'sand', 'oasis'] },
      { biome: 'cave-world', tags: ['cave', 'underground', 'crystals', 'glowing'] },

      // WEATHER
      { biome: 'rain-world', tags: ['rain', 'precipitation', 'storm', 'weather'] },
      { biome: 'heavy-rain', tags: ['heavy-rain', 'downpour', 'dark', 'weather'] },
      { biome: 'snow-world', tags: ['snow', 'winter', 'blizzard', 'ice', 'weather'] },
      { biome: 'thunder-storm', tags: ['thunder', 'lightning', 'storm', 'flashes'] },
      { biome: 'wind-storm', tags: ['wind', 'gale', 'turbulent', 'weather'] },
      { biome: 'fog-world', tags: ['fog', 'mist', 'haze', 'mystery'] },
      { biome: 'aurora-world', tags: ['aurora', 'northern-lights', 'glow', 'cosmic'] },
      { biome: 'sunset-sunrise', tags: ['sunset', 'golden-hour', 'sky', 'warm'] },

      // ELEMENTS
      { biome: 'volcano-world', tags: ['volcano', 'magma', 'lava', 'fire'] },
      { biome: 'lava-flow', tags: ['lava', 'molten', 'heat', 'embers'] },
      { biome: 'fire-ember', tags: ['fire', 'embers', 'sparks', 'heat'] },
      { biome: 'lightning-world', tags: ['lightning', 'electric', 'energy', 'shock'] },
      { biome: 'plasma-world', tags: ['plasma', 'neon', 'ion', 'energy'] },
      { biome: 'energy-world', tags: ['energy', 'pulse', 'quantum', 'glow'] },
      { biome: 'liquid-world', tags: ['liquid', 'fluid', 'viscous', 'elements'] },
      { biome: 'smoke-fog', tags: ['smoke', 'ash', 'haze', 'atmosphere'] },

      // FUTURISTIC
      { biome: 'cyber-city', tags: ['cyberpunk', 'city', 'neon', 'skyscrapers'] },
      { biome: 'neon-highway', tags: ['traffic', 'highway', 'speed', 'cyber'] },
      { biome: 'futuristic-city', tags: ['future', 'metropolis', 'scifi', 'spires'] },
      { biome: 'hologram-city', tags: ['hologram', 'virtual', 'beams', 'cyber'] },
      { biome: 'space-city', tags: ['space', 'orbital', 'station', 'colony'] },
      { biome: 'scifi-station', tags: ['station', 'outpost', 'hangar', 'scifi'] },
      { biome: 'robot-mechanical', tags: ['mech', 'industrial', 'circuit', 'tech'] },
      { biome: 'digital-grid', tags: ['grid', 'tron', 'matrix', 'wireframe'] },

      // FANTASY / ABSTRACT
      { biome: 'crystal-world', tags: ['crystal', 'gem', 'refraction', 'fantasy'] },
      { biome: 'liquid-glass', tags: ['glass', 'translucent', 'prismatic', 'abstract'] },
      { biome: 'floating-islands', tags: ['floating', 'islands', 'sky', 'gravity'] },
      { biome: 'fractal-world', tags: ['fractal', 'math', 'recursive', 'geometry'] },
      { biome: 'organic-world', tags: ['organic', 'cells', 'biology', 'living'] },
      { biome: 'micro-world', tags: ['micro', 'quantum', 'spores', 'atoms'] },
      { biome: 'dream-world', tags: ['dream', 'surreal', 'ethereal', 'fantasy'] },
      { biome: 'portal-world', tags: ['portal', 'wormhole', 'gateway', 'warp'] },
      { biome: 'time-tunnel', tags: ['time', 'tunnel', 'vortex', 'infinite'] }
    ];

    for (const item of biomes) {
      const dna = EnvironmentDNAFactory.getPresetByBiome(item.biome, 1000 + this.presets.size);
      const preset: EnvironmentPreset = {
        id: item.biome,
        title: EnvironmentDNAFactory.formatName(item.biome),
        category: dna.category,
        biome: item.biome,
        tags: item.tags,
        dna
      };
      this.presets.set(item.biome, preset);
    }
  }

  public getAllPresets(): EnvironmentPreset[] {
    return [...Array.from(this.presets.values()), ...Array.from(this.customPresets.values())];
  }

  public getByCategory(category: BiomeCategory | 'All'): EnvironmentPreset[] {
    const all = this.getAllPresets();
    if (!category || category === 'All') return all;
    return all.filter(p => p.category === category);
  }

  public getPresetById(id: string): EnvironmentPreset | undefined {
    return this.presets.get(id) || this.customPresets.get(id);
  }

  public saveCustomPreset(dna: EnvironmentDNA): EnvironmentPreset {
    const preset: EnvironmentPreset = {
      id: dna.id,
      title: dna.name,
      category: dna.category,
      biome: dna.biome,
      tags: ['custom', dna.category.toLowerCase(), dna.biome],
      dna
    };
    this.customPresets.set(preset.id, preset);
    this.persistCustomPresets();
    return preset;
  }

  private persistCustomPresets() {
    try {
      const arr = Array.from(this.customPresets.values());
      localStorage.setItem('hyperwall_custom_environments', JSON.stringify(arr));
    } catch {
      // ignore quota errors
    }
  }

  private loadCustomPresets() {
    try {
      const data = localStorage.getItem('hyperwall_custom_environments');
      if (data) {
        const parsed: EnvironmentPreset[] = JSON.parse(data);
        for (const p of parsed) {
          this.customPresets.set(p.id, p);
        }
      }
    } catch {
      // ignore parse errors
    }
  }
}
