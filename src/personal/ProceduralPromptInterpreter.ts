import { WorldType, ParsedPromptDirectives } from './types';
import { BiomeType, WeatherType, TimeOfDay } from '../environment/types/environmentDNA';

/**
 * 100% OFFLINE Deterministic Keyword & Rule Interpreter.
 * Analyzes natural descriptive text locally using regex tokenization and semantic rule matching.
 * NO API, NO external AI, NO network calls. Unsupported words are safely ignored.
 */
export class ProceduralPromptInterpreter {
  private static readonly SUPPORTED_KEYWORDS: { [key: string]: string } = {
    // Space / Celestial
    'galaxy': 'galaxy',
    'galaxies': 'galaxy',
    'nebula': 'nebula',
    'nebulae': 'nebula',
    'black hole': 'black hole',
    'blackhole': 'black hole',
    'singularity': 'black hole',
    'planet': 'planet',
    'planets': 'planet',
    'star': 'stars',
    'stars': 'stars',
    'stellar': 'stars',
    'cosmos': 'galaxy',
    'space': 'galaxy',

    // Nature & Terrains
    'ocean': 'ocean',
    'sea': 'ocean',
    'water': 'ocean',
    'rain': 'rain',
    'rainy': 'rain',
    'forest': 'forest',
    'trees': 'forest',
    'jungle': 'forest',
    'mountain': 'mountain',
    'mountains': 'mountain',
    'peak': 'mountain',
    'snow': 'snow',
    'snowy': 'snow',
    'ice': 'snow',
    'blizzard': 'snow',
    'volcano': 'volcano',
    'volcanic': 'volcano',
    'lava': 'lava',
    'magma': 'lava',
    'desert': 'desert',
    'dunes': 'desert',
    'sand': 'desert',

    // Atmospheric & Weather
    'aurora': 'aurora',
    'northern lights': 'aurora',
    'cloud': 'cloud',
    'clouds': 'cloud',
    'storm': 'storm',
    'thunder': 'storm',
    'lightning': 'storm',
    'fog': 'fog',
    'mist': 'fog',
    'hazy': 'fog',
    'night': 'night',
    'midnight': 'night',
    'sunset': 'sunset',
    'sunrise': 'sunset',
    'dawn': 'sunset',

    // Futuristic / Abstract / Crystal
    'cyber': 'cyber',
    'cyberpunk': 'cyber',
    'city': 'cyber',
    'neon': 'neon',
    'crystal': 'crystal',
    'crystals': 'crystal',
    'energy': 'energy',
    'plasma': 'energy',
    'portal': 'portal',
    'wormhole': 'portal',
    'fractal': 'fractal',
    'particles': 'particles'
  };

  private static readonly COLOR_KEYWORDS: { [key: string]: string } = {
    'blue': '#00F0FF',
    'cyan': '#00FFE0',
    'purple': '#7000FF',
    'violet': '#9D00FF',
    'magenta': '#FF00A0',
    'pink': '#FF007F',
    'red': '#FF3366',
    'orange': '#FF8800',
    'gold': '#FFD700',
    'yellow': '#FFEE00',
    'green': '#00FFA3',
    'emerald': '#10B981',
    'dark': '#05070E',
    'black': '#000000',
    'white': '#FFFFFF',
    'neon': '#00F0FF'
  };

  /**
   * Interprets user descriptive string and extracts valid procedural directives.
   */
  public static interpret(prompt: string): ParsedPromptDirectives {
    if (!prompt || typeof prompt !== 'string') {
      return {
        recognizedKeywords: [],
        colorBiases: [],
        features: {}
      };
    }

    const normalized = prompt.toLowerCase().trim();
    const recognizedSet = new Set<string>();
    const colorBiases: string[] = [];
    const features: ParsedPromptDirectives['features'] = {};

    let suggestedWorldType: WorldType | undefined;
    let suggestedBiome: BiomeType | undefined;
    let suggestedWeather: WeatherType | undefined;
    let suggestedTime: TimeOfDay | undefined;

    // Multi-word phrases match first
    for (const [key, canonical] of Object.entries(this.SUPPORTED_KEYWORDS)) {
      if (key.includes(' ') && normalized.includes(key)) {
        recognizedSet.add(canonical);
      }
    }

    // Tokenize into words
    const tokens = normalized.split(/[\s,.;:!?+/_~-]+/);
    for (const token of tokens) {
      if (!token) continue;
      if (this.SUPPORTED_KEYWORDS[token]) {
        recognizedSet.add(this.SUPPORTED_KEYWORDS[token]);
      }
      if (this.COLOR_KEYWORDS[token]) {
        colorBiases.push(this.COLOR_KEYWORDS[token]);
      }
    }

    const keywords = Array.from(recognizedSet);

    // Apply rule-based inference from recognized keywords
    for (const kw of keywords) {
      switch (kw) {
        case 'galaxy':
        case 'nebula':
        case 'stars':
          suggestedWorldType = suggestedWorldType || 'SPACE';
          suggestedBiome = suggestedBiome || 'space-city';
          features.hasStars = true;
          break;

        case 'black hole':
          suggestedWorldType = 'SPACE';
          features.hasBlackHole = true;
          break;

        case 'planet':
          features.hasPlanets = true;
          break;

        case 'ocean':
          suggestedWorldType = suggestedWorldType || 'OCEAN';
          suggestedBiome = 'ocean-world';
          features.hasOcean = true;
          break;

        case 'forest':
          suggestedWorldType = suggestedWorldType || 'FOREST';
          suggestedBiome = 'living-forest';
          break;

        case 'mountain':
          suggestedWorldType = suggestedWorldType || 'MOUNTAIN';
          suggestedBiome = 'mountain-world';
          break;

        case 'volcano':
        case 'lava':
          suggestedWorldType = suggestedWorldType || 'VOLCANO';
          suggestedBiome = 'volcano-world';
          features.hasLava = true;
          break;

        case 'cyber':
        case 'neon':
          suggestedWorldType = suggestedWorldType || 'CYBER CITY';
          suggestedBiome = 'cyber-city';
          features.hasNeon = true;
          break;

        case 'crystal':
          suggestedWorldType = suggestedWorldType || 'CRYSTAL';
          suggestedBiome = 'crystal-world';
          features.hasCrystals = true;
          break;

        case 'energy':
          suggestedWorldType = suggestedWorldType || 'ENERGY';
          suggestedBiome = 'energy-world';
          break;

        case 'portal':
          suggestedWorldType = suggestedWorldType || 'FANTASY';
          suggestedBiome = 'portal-world';
          features.hasPortal = true;
          break;

        case 'fractal':
          suggestedWorldType = suggestedWorldType || 'ABSTRACT';
          suggestedBiome = 'fractal-world';
          break;

        case 'desert':
          suggestedWorldType = suggestedWorldType || 'NATURE';
          suggestedBiome = 'desert-oasis';
          break;

        case 'rain':
          suggestedWeather = 'rain';
          break;

        case 'snow':
          suggestedWeather = 'snow';
          features.hasSnow = true;
          break;

        case 'storm':
          suggestedWeather = 'storm';
          break;

        case 'aurora':
          suggestedWeather = suggestedWeather || 'aurora';
          features.hasAurora = true;
          break;

        case 'cloud':
          features.hasClouds = true;
          break;

        case 'fog':
          suggestedWeather = suggestedWeather || 'fog';
          break;

        case 'night':
          suggestedTime = 'night';
          break;

        case 'sunset':
          suggestedTime = 'sunset';
          break;
      }
    }

    return {
      recognizedKeywords: keywords,
      suggestedWorldType,
      suggestedBiome,
      suggestedWeather,
      suggestedTime,
      colorBiases,
      features
    };
  }
}
