import { AudioPresetType, AudioReactiveConfig } from './types';

export interface AudioPresetDefinition {
  id: AudioPresetType;
  name: string;
  description: string;
  config: Partial<AudioReactiveConfig>;
}

export class AudioPresetManager {
  private presets: Record<AudioPresetType, AudioPresetDefinition> = {
    subtle: {
      id: 'subtle',
      name: 'Subtle',
      description: 'Gentle, meditative reactivity with high smoothing and soft visual response',
      config: {
        sensitivity: 0.7,
        bassReaction: 0.6,
        midReaction: 0.5,
        trebleReaction: 0.5,
        beatReaction: 0.5,
        visualIntensity: 0.6,
        cameraReaction: 0.15,
        physicsReaction: 0.5,
        smoothingTimeConstant: 0.92,
      },
    },
    balanced: {
      id: 'balanced',
      name: 'Balanced',
      description: 'Natural equilibrium between visual dynamism and aesthetic comfort',
      config: {
        sensitivity: 1.0,
        bassReaction: 1.0,
        midReaction: 1.0,
        trebleReaction: 1.0,
        beatReaction: 1.0,
        visualIntensity: 1.0,
        cameraReaction: 0.3,
        physicsReaction: 1.0,
        smoothingTimeConstant: 0.82,
      },
    },
    dynamic: {
      id: 'dynamic',
      name: 'Dynamic',
      description: 'Punchy responses to kicks, snares, and bass drops with rapid recovery',
      config: {
        sensitivity: 1.35,
        bassReaction: 1.35,
        midReaction: 1.15,
        trebleReaction: 1.2,
        beatReaction: 1.4,
        visualIntensity: 1.35,
        cameraReaction: 0.45,
        physicsReaction: 1.4,
        smoothingTimeConstant: 0.75,
      },
    },
    cinematic: {
      id: 'cinematic',
      name: 'Cinematic',
      description: 'Expansive sub-bass pulses, camera drift, and atmospheric light blooms',
      config: {
        sensitivity: 1.15,
        bassReaction: 1.5,
        midReaction: 0.9,
        trebleReaction: 0.85,
        beatReaction: 1.25,
        visualIntensity: 1.2,
        cameraReaction: 0.5,
        physicsReaction: 1.1,
        smoothingTimeConstant: 0.86,
      },
    },
    extreme: {
      id: 'extreme',
      name: 'Extreme',
      description: 'Maximal energy bursts, high frequency responsiveness, and intense physical shockwaves',
      config: {
        sensitivity: 1.8,
        bassReaction: 1.8,
        midReaction: 1.5,
        trebleReaction: 1.6,
        beatReaction: 1.8,
        visualIntensity: 1.8,
        cameraReaction: 0.7,
        physicsReaction: 1.8,
        smoothingTimeConstant: 0.65,
      },
    },
  };

  public getPreset(id: AudioPresetType): AudioPresetDefinition {
    return this.presets[id] || this.presets.balanced;
  }

  public getAllPresets(): AudioPresetDefinition[] {
    return Object.values(this.presets);
  }
}
