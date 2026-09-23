import { WorldStyle, WorldAtmosphere } from './types';
import { MaterialType } from '../designer/types/designDNA';

export interface StyleAesthetics {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  backgroundColor: string;
  materialType: MaterialType;
  roughness: number;
  metalness: number;
  transmission: number;
  emissiveIntensity: number;
  bloom: number;
  fog: number;
  atmosphereScale: number;
  postProcessing: boolean;
  amoledBlack: boolean;
}

export class StyleGenerator {
  public static getAesthetics(style: WorldStyle, atmosphere: WorldAtmosphere, colorBiases?: string[]): StyleAesthetics {
    let base: StyleAesthetics;

    switch (style) {
      case 'AMOLED':
        base = {
          primaryColor: '#00F0FF',
          secondaryColor: '#7000FF',
          accentColor: '#00FFA3',
          glowColor: '#00F0FF',
          backgroundColor: '#000000',
          materialType: 'energy',
          roughness: 0.1,
          metalness: 0.8,
          transmission: 0.2,
          emissiveIntensity: 1.8,
          bloom: 1.2,
          fog: 0.05,
          atmosphereScale: 0.8,
          postProcessing: true,
          amoledBlack: true
        };
        break;

      case 'NEON':
        base = {
          primaryColor: '#00F0FF',
          secondaryColor: '#FF007F',
          accentColor: '#FFE600',
          glowColor: '#00F0FF',
          backgroundColor: '#030510',
          materialType: 'hologram',
          roughness: 0.2,
          metalness: 0.7,
          transmission: 0.4,
          emissiveIntensity: 2.2,
          bloom: 1.6,
          fog: 0.25,
          atmosphereScale: 1.3,
          postProcessing: true,
          amoledBlack: false
        };
        break;

      case 'CINEMATIC':
        base = {
          primaryColor: '#00D2FF',
          secondaryColor: '#FF7700',
          accentColor: '#FFD700',
          glowColor: '#0099FF',
          backgroundColor: '#050711',
          materialType: 'metal',
          roughness: 0.45,
          metalness: 0.6,
          transmission: 0.1,
          emissiveIntensity: 1.1,
          bloom: 0.9,
          fog: 0.35,
          atmosphereScale: 1.2,
          postProcessing: true,
          amoledBlack: false
        };
        break;

      case 'FUTURISTIC':
        base = {
          primaryColor: '#00FFE0',
          secondaryColor: '#1A56FF',
          accentColor: '#B500FF',
          glowColor: '#00FFE0',
          backgroundColor: '#060B18',
          materialType: 'glass-style',
          roughness: 0.15,
          metalness: 0.85,
          transmission: 0.5,
          emissiveIntensity: 1.5,
          bloom: 1.2,
          fog: 0.2,
          atmosphereScale: 1.1,
          postProcessing: true,
          amoledBlack: false
        };
        break;

      case 'DREAM':
        base = {
          primaryColor: '#FF99C8',
          secondaryColor: '#D0F4DE',
          accentColor: '#A9DEF9',
          glowColor: '#E4C1F9',
          backgroundColor: '#0A0818',
          materialType: 'liquid-style',
          roughness: 0.3,
          metalness: 0.2,
          transmission: 0.7,
          emissiveIntensity: 1.3,
          bloom: 1.4,
          fog: 0.45,
          atmosphereScale: 1.5,
          postProcessing: true,
          amoledBlack: false
        };
        break;

      case 'DARK':
        base = {
          primaryColor: '#6B7280',
          secondaryColor: '#9333EA',
          accentColor: '#E11D48',
          glowColor: '#7C3AED',
          backgroundColor: '#030408',
          materialType: 'metal',
          roughness: 0.6,
          metalness: 0.5,
          transmission: 0.05,
          emissiveIntensity: 0.7,
          bloom: 0.5,
          fog: 0.5,
          atmosphereScale: 0.9,
          postProcessing: false,
          amoledBlack: false
        };
        break;

      case 'MYSTICAL':
        base = {
          primaryColor: '#B026FF',
          secondaryColor: '#00FFCC',
          accentColor: '#FFB800',
          glowColor: '#9933FF',
          backgroundColor: '#070514',
          materialType: 'crystal',
          roughness: 0.25,
          metalness: 0.4,
          transmission: 0.6,
          emissiveIntensity: 1.4,
          bloom: 1.3,
          fog: 0.4,
          atmosphereScale: 1.4,
          postProcessing: true,
          amoledBlack: false
        };
        break;

      case 'MINIMAL':
        base = {
          primaryColor: '#E5E7EB',
          secondaryColor: '#3B82F6',
          accentColor: '#10B981',
          glowColor: '#60A5FA',
          backgroundColor: '#0A0D14',
          materialType: 'glass-style',
          roughness: 0.2,
          metalness: 0.3,
          transmission: 0.3,
          emissiveIntensity: 0.8,
          bloom: 0.4,
          fog: 0.15,
          atmosphereScale: 0.8,
          postProcessing: false,
          amoledBlack: false
        };
        break;

      case 'CHAOTIC':
        base = {
          primaryColor: '#EF4444',
          secondaryColor: '#F59E0B',
          accentColor: '#8B5CF6',
          glowColor: '#F97316',
          backgroundColor: '#0F0606',
          materialType: 'lava',
          roughness: 0.4,
          metalness: 0.6,
          transmission: 0.15,
          emissiveIntensity: 2.0,
          bloom: 1.7,
          fog: 0.55,
          atmosphereScale: 1.6,
          postProcessing: true,
          amoledBlack: false
        };
        break;

      case 'PEACEFUL':
        base = {
          primaryColor: '#34D399',
          secondaryColor: '#60A5FA',
          accentColor: '#FBBF24',
          glowColor: '#10B981',
          backgroundColor: '#040C12',
          materialType: 'organic',
          roughness: 0.5,
          metalness: 0.2,
          transmission: 0.4,
          emissiveIntensity: 0.9,
          bloom: 0.7,
          fog: 0.3,
          atmosphereScale: 1.1,
          postProcessing: false,
          amoledBlack: false
        };
        break;

      case 'REALISTIC-STYLE':
      default:
        base = {
          primaryColor: '#38BDF8',
          secondaryColor: '#10B981',
          accentColor: '#F59E0B',
          glowColor: '#0EA5E9',
          backgroundColor: '#050B14',
          materialType: 'metal',
          roughness: 0.55,
          metalness: 0.45,
          transmission: 0.2,
          emissiveIntensity: 0.8,
          bloom: 0.6,
          fog: 0.25,
          atmosphereScale: 1.0,
          postProcessing: true,
          amoledBlack: false
        };
        break;
    }

    // Atmosphere nuance adjustments
    switch (atmosphere) {
      case 'STORMY':
        base.fog = Math.min(1.0, base.fog + 0.3);
        base.atmosphereScale = Math.min(2.0, base.atmosphereScale + 0.3);
        base.backgroundColor = '#030508';
        break;
      case 'COSMIC':
        base.bloom = Math.min(2.0, base.bloom + 0.3);
        base.emissiveIntensity = Math.min(3.0, base.emissiveIntensity + 0.4);
        break;
      case 'CALM':
        base.bloom = Math.max(0.2, base.bloom * 0.8);
        base.fog = Math.max(0.1, base.fog * 0.8);
        break;
      case 'ENERGETIC':
        base.emissiveIntensity = Math.min(3.0, base.emissiveIntensity + 0.5);
        base.bloom = Math.min(2.0, base.bloom + 0.4);
        break;
      case 'DEEP':
        base.fog = Math.min(1.0, base.fog + 0.25);
        base.roughness = Math.min(1.0, base.roughness + 0.2);
        break;
      case 'DREAMLIKE':
        base.transmission = Math.min(1.0, base.transmission + 0.2);
        base.bloom = Math.min(2.0, base.bloom + 0.2);
        break;
    }

    // Honor explicit user color biases if present
    if (colorBiases && colorBiases.length > 0) {
      base.primaryColor = colorBiases[0];
      if (colorBiases.length > 1) {
        base.secondaryColor = colorBiases[1];
      }
      if (colorBiases.length > 2) {
        base.accentColor = colorBiases[2];
      }
      base.glowColor = colorBiases[0];
    }

    return base;
  }
}
