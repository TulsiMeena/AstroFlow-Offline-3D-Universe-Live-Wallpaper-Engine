import { ColorPreset, ProceduralColors } from '../types/designDNA';

export interface ColorPalettePreset {
  name: ColorPreset;
  label: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    glow: string;
    background: string;
  };
}

export class ProceduralColorEngine {
  public static readonly PRESETS: Record<ColorPreset, ColorPalettePreset> = {
    AMOLED: {
      name: 'AMOLED',
      label: 'AMOLED Pitch',
      description: 'True pitch black backdrop with radiant high-contrast neon accents for OLED efficiency.',
      colors: {
        primary: '#00F0FF',
        secondary: '#9D00FF',
        accent: '#00FFA3',
        glow: '#00F0FF',
        background: '#000000',
      }
    },
    COSMIC: {
      name: 'COSMIC',
      label: 'Cosmic Stellar',
      description: 'Deep violet space mist, astral cyan stars, and stellar magenta corona.',
      colors: {
        primary: '#8A2BE2',
        secondary: '#00D4FF',
        accent: '#FF007F',
        glow: '#B300FF',
        background: '#04020a',
      }
    },
    NEON: {
      name: 'NEON',
      label: 'Cyber Neon',
      description: 'Vibrant electric cyan, laser magenta, and toxic green synthwave energy.',
      colors: {
        primary: '#00F0FF',
        secondary: '#FF0055',
        accent: '#FFE600',
        glow: '#00FFA3',
        background: '#060713',
      }
    },
    OCEAN: {
      name: 'OCEAN',
      label: 'Abyssal Oceanic',
      description: 'Deep bioluminescent teal, aquatic turquoise, and twilight deep marine.',
      colors: {
        primary: '#00B4D8',
        secondary: '#0077B6',
        accent: '#90E0EF',
        glow: '#00F5D4',
        background: '#020b14',
      }
    },
    FOREST: {
      name: 'FOREST',
      label: 'Emerald Forest',
      description: 'Bioluminescent moss, emerald canopies, and warm firefly gold.',
      colors: {
        primary: '#10B981',
        secondary: '#059669',
        accent: '#FBBF24',
        glow: '#34D399',
        background: '#03140d',
      }
    },
    FIRE: {
      name: 'FIRE',
      label: 'Solar Magma',
      description: 'Incandescent plasma flame, molten lava orange, and radiant solar gold.',
      colors: {
        primary: '#FF4500',
        secondary: '#FF8C00',
        accent: '#FFD700',
        glow: '#FF2A00',
        background: '#130402',
      }
    },
    ICE: {
      name: 'ICE',
      label: 'Glacial Aurora',
      description: 'Sub-zero crystal frost, arctic blue, and prismatic frozen refraction.',
      colors: {
        primary: '#A0E7E5',
        secondary: '#B4F8C8',
        accent: '#FBE7C6',
        glow: '#70E4EF',
        background: '#030b14',
      }
    },
    CRYSTAL: {
      name: 'CRYSTAL',
      label: 'Prismatic Quartz',
      description: 'Translucent crystal refraction with amethyst, ruby, and quartz highlights.',
      colors: {
        primary: '#C084FC',
        secondary: '#E879F9',
        accent: '#67E8F9',
        glow: '#D8B4FE',
        background: '#090514',
      }
    },
    CYBER: {
      name: 'CYBER',
      label: 'Neo Tokyo Grid',
      description: 'High-density chromatic aberration, laser cyan, and Tokyo midnight purple.',
      colors: {
        primary: '#00F0FF',
        secondary: '#7928CA',
        accent: '#FF0080',
        glow: '#00E5FF',
        background: '#050510',
      }
    },
    FANTASY: {
      name: 'FANTASY',
      label: 'Ethereal Dream',
      description: 'Dreamlike pastel auroras, celestial gold, and mystical violet twilight.',
      colors: {
        primary: '#F472B6',
        secondary: '#818CF8',
        accent: '#FCD34D',
        glow: '#C084FC',
        background: '#0a0618',
      }
    }
  };

  /**
   * Returns preset palette colors
   */
  public static getPresetColors(preset: ColorPreset): ProceduralColors {
    const p = this.PRESETS[preset] || this.PRESETS.AMOLED;
    return {
      primary: p.colors.primary,
      secondary: p.colors.secondary,
      accent: p.colors.accent,
      glow: p.colors.glow,
      background: p.colors.background,
      preset: p.name,
      harmony: 'complementary'
    };
  }

  /**
   * Deterministically generates harmonious colors from a seed number or hash
   */
  public static generateHarmoniousColors(seedNum: number): ProceduralColors {
    const baseHue = (seedNum * 137.508) % 360;
    const presetsList: ColorPreset[] = [
      'AMOLED', 'COSMIC', 'NEON', 'OCEAN', 'FOREST', 'FIRE', 'ICE', 'CRYSTAL', 'CYBER', 'FANTASY'
    ];
    const presetChoice = presetsList[Math.floor((seedNum * 7) % presetsList.length)];
    const basePreset = this.PRESETS[presetChoice];

    // Compute harmonic offsets
    const primary = this.hslToHex(baseHue, 90, 55);
    const secondary = this.hslToHex((baseHue + 45) % 360, 85, 50);
    const accent = this.hslToHex((baseHue + 180) % 360, 95, 60);
    const glow = this.hslToHex((baseHue + 25) % 360, 100, 65);
    const bgHue = (baseHue + 200) % 360;
    const background = (seedNum % 2 === 0) ? '#000000' : this.hslToHex(bgHue, 40, 4);

    return {
      primary,
      secondary,
      accent,
      glow,
      background,
      preset: presetChoice,
      harmony: 'complementary'
    };
  }

  /**
   * Helper: HSL to HEX
   */
  public static hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  /**
   * Helper: Hex to RGB 0..1
   */
  public static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: ((num >> 16) & 255) / 255,
      g: ((num >> 8) & 255) / 255,
      b: (num & 255) / 255,
    };
  }
}
