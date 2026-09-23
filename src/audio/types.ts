/**
 * Amit HyperWall - Advanced Audio Reactive + Generative Sound Engine
 * 100% Offline, Local-Only, Web Audio API procedural synthesis & analysis
 */

export type AudioPresetType = 'subtle' | 'balanced' | 'dynamic' | 'cinematic' | 'extreme';

export type GenerativeSoundCategory =
  | 'space'
  | 'ocean'
  | 'rain'
  | 'wind'
  | 'forest'
  | 'cyber'
  | 'energy'
  | 'portal'
  | 'underwater';

export type WallpaperAudioProfileType =
  | 'cosmic'
  | 'galaxy'
  | 'black-hole'
  | 'nebula'
  | 'ocean'
  | 'forest'
  | 'aurora'
  | 'volcano'
  | 'cyber-city'
  | 'neon-highway'
  | 'crystal'
  | 'liquid-glass'
  | 'energy'
  | 'fractal'
  | 'portal'
  | 'living-world';

export type AudioPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface AudioFrequencyBands {
  subBass: number;   // 20-60 Hz
  bass: number;      // 60-250 Hz
  lowMid: number;    // 250-500 Hz
  mid: number;       // 500-2000 Hz
  highMid: number;   // 2000-4000 Hz
  presence: number;  // 4000-6000 Hz
  treble: number;    // 6000-12000 Hz
  brilliance: number;// 12000-20000 Hz
}

export interface AudioAnalysisData {
  volume: number;           // 0.0 to 1.0 (RMS / peak normalized)
  bass: number;             // 0.0 to 1.0
  mid: number;              // 0.0 to 1.0
  treble: number;           // 0.0 to 1.0
  energy: number;           // 0.0 to 1.0
  isBeat: boolean;          // true on transient beat onset
  beatConfidence: number;   // 0.0 to 1.0
  bpm: number;              // Estimated tempo
  rhythmIntensity: number;  // 0.0 to 1.0
  bands: AudioFrequencyBands;
  bandArray: number[];      // 8 normalized bands for visualizers
  rawFrequencies: Uint8Array<any>;
  timeDomain: Uint8Array<any>;
  timestamp: number;
}

export interface AudioReactiveConfig {
  enabled: boolean;
  localAudioEnabled: boolean;
  generativeSoundEnabled: boolean;
  sensitivity: number;       // 0.2 to 3.0
  bassReaction: number;      // 0.0 to 2.0
  midReaction: number;       // 0.0 to 2.0
  trebleReaction: number;    // 0.0 to 2.0
  beatReaction: number;      // 0.0 to 2.0
  visualIntensity: number;   // 0.0 to 2.0
  cameraReaction: number;    // 0.0 to 1.0 (soft capped for comfort)
  physicsReaction: number;   // 0.0 to 2.0
  preset: AudioPresetType;
  soundCategory: GenerativeSoundCategory;
  soundVolume: number;       // 0.0 to 1.0
  smoothingTimeConstant: number; // 0.6 to 0.95
}

export interface AudioReactiveVisualTargets {
  particleScale: number;      // 1.0 baseline
  galaxyPulse: number;        // 0.0 to 1.0
  waveAmplitude: number;      // 1.0 baseline
  bloomBoost: number;         // 0.0 to 1.0
  auroraFlowSpeed: number;    // 1.0 baseline
  sparksCountMultiplier: number;// 1.0 baseline
  crystalVibration: number;   // 0.0 to 1.0
  shockwaveTrigger: boolean;
  cameraMicroDrift: { x: number; y: number; z: number; zoom: number };
  gravityPulse: number;       // -1.0 to 1.0
  vortexIntensity: number;    // 0.0 to 2.0
  turbulenceBoost: number;    // 0.0 to 2.0
}

export interface WallpaperProfileConfig {
  id: WallpaperAudioProfileType;
  name: string;
  bassTarget: string;
  midTarget: string;
  trebleTarget: string;
  beatAction: string;
  colorShiftWeight: number;
  displacementWeight: number;
  energyDecay: number;
}
