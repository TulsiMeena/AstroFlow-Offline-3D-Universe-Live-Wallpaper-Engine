import { DesignDNA, FusionElement } from '../types/designDNA';
import { DesignSeedEngine } from '../seed/DesignSeedEngine';

export interface FusionPresetItem {
  id: string;
  name: string;
  elements: FusionElement[];
  description: string;
  tag: string;
  colorPreset: 'AMOLED' | 'COSMIC' | 'NEON' | 'OCEAN' | 'FOREST' | 'FIRE' | 'ICE' | 'CRYSTAL' | 'CYBER' | 'FANTASY';
  materialType: 'metal' | 'glass-style' | 'crystal' | 'liquid-style' | 'energy' | 'lava' | 'ice' | 'hologram' | 'organic' | 'cosmic dust';
}

export class PresetManager {
  public static readonly PRESETS: FusionPresetItem[] = [
    {
      id: 'galaxy-aurora',
      name: 'Galactic Aurora Borealis',
      elements: ['GALAXY', 'AURORA', 'SPACE'],
      description: 'Swirling celestial spiral arms veiled in rippling polar light curtains.',
      tag: 'Cosmic Mystique',
      colorPreset: 'COSMIC',
      materialType: 'energy',
    },
    {
      id: 'ocean-aurora',
      name: 'Abyssal Aurora Ocean',
      elements: ['OCEAN', 'AURORA', 'PARTICLES'],
      description: 'Undulating bioluminescent ocean waves reflecting shimmering ionosphere lights.',
      tag: 'Liquid Bioluminescence',
      colorPreset: 'OCEAN',
      materialType: 'liquid-style',
    },
    {
      id: 'forest-rain',
      name: 'Bioluminescent Forest Rain',
      elements: ['FOREST', 'RAIN', 'LIVING WORLD'],
      description: 'Atmospheric downpour through ancient canopy woods with floating micro-spores.',
      tag: 'Living Earth',
      colorPreset: 'FOREST',
      materialType: 'organic',
    },
    {
      id: 'cyber-rain',
      name: 'Neo-Tokyo Cyber Rain',
      elements: ['CYBER CITY', 'RAIN', 'NEON'],
      description: 'Reflective wet asphalt grid, holographic skyscraper towers, and neon downpour.',
      tag: 'Cyberpunk Synthwave',
      colorPreset: 'CYBER',
      materialType: 'hologram',
    },
    {
      id: 'volcano-snow',
      name: 'Glacial Caldera Blizzard',
      elements: ['VOLCANO', 'SNOW', 'LAVA'],
      description: 'Molten incandescent magma fissures cutting across sub-zero blizzard drifts.',
      tag: 'Elemental Conflict',
      colorPreset: 'FIRE',
      materialType: 'lava',
    },
    {
      id: 'crystal-energy',
      name: 'Quantum Crystal Resonance',
      elements: ['CRYSTAL', 'ENERGY', 'PORTAL'],
      description: 'Prismatic floating quartz monoliths pulsing with geometric plasma beams.',
      tag: 'Prismatic Power',
      colorPreset: 'CRYSTAL',
      materialType: 'crystal',
    },
    {
      id: 'blackhole-galaxy',
      name: 'Singularity Accretion Core',
      elements: ['BLACK HOLE', 'GALAXY', 'SPACE'],
      description: 'Gravitational lensing vortex bending spiral starfields into an event horizon.',
      tag: 'Relativistic Space',
      colorPreset: 'AMOLED',
      materialType: 'cosmic dust',
    },
    {
      id: 'ocean-space',
      name: 'Cosmic Stellar Ocean',
      elements: ['OCEAN', 'SPACE', 'NEBULA'],
      description: 'Floating liquid ocean surface suspended amidst colorful deep space star nebulae.',
      tag: 'Surreal Cosmos',
      colorPreset: 'COSMIC',
      materialType: 'liquid-style',
    },
    {
      id: 'forest-fireflies',
      name: 'Enchanted Twilight Fireflies',
      elements: ['FOREST', 'LIVING WORLD', 'PARTICLES'],
      description: 'Hundreds of pulsing sentient fireflies dancing through mystical midnight trees.',
      tag: 'Ethereal Magic',
      colorPreset: 'FANTASY',
      materialType: 'organic',
    },
    {
      id: 'mountain-aurora',
      name: 'Alpine Aurora Pinnacle',
      elements: ['MOUNTAIN', 'AURORA', 'SNOW'],
      description: 'Glacial mountain peaks framed by soaring ribbons of solar magnetic plasma.',
      tag: 'Glacial Majesty',
      colorPreset: 'ICE',
      materialType: 'ice',
    },
    {
      id: 'cyber-portal',
      name: 'Hyperdrive Cyber Portal',
      elements: ['CYBER CITY', 'PORTAL', 'FRACTAL'],
      description: 'Recursive holographic wormhole warping cybernetic city geometry into infinity.',
      tag: 'Quantum Warp',
      colorPreset: 'NEON',
      materialType: 'metal',
    },
    {
      id: 'liquidglass-energy',
      name: 'Prismatic Liquid Glass',
      elements: ['LIQUID GLASS', 'ENERGY', 'FRACTAL'],
      description: 'Translucent refractive glass fluid undulating under hyper-vivid energy fields.',
      tag: 'Modern Abstract',
      colorPreset: 'CRYSTAL',
      materialType: 'glass-style',
    },
  ];

  /**
   * Generates a complete DesignDNA for a preset
   */
  public static getPresetDNA(presetId: string): DesignDNA {
    const p = this.PRESETS.find(item => item.id === presetId) || this.PRESETS[0];
    const seed = `PRESET-${p.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dna = DesignSeedEngine.createDNAFromSeed(seed, p.elements);

    // Apply specific preset attributes
    dna.name = p.name;
    dna.material.type = p.materialType;
    dna.colors.preset = p.colorPreset;

    return DesignSeedEngine.sanitizeDNA(dna);
  }
}
