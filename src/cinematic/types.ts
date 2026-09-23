import * as THREE from 'three';
import { QualityProfile } from '../types/engine';

export type CameraMode =
  | 'free'
  | 'cinematic'
  | 'orbit'
  | 'follow'
  | 'fly'
  | 'macro'
  | 'planet'
  | 'galaxy'
  | 'portal'
  | 'infinite-zoom';

export type VisualPresetType =
  | 'cinematic'
  | 'relaxed'
  | 'dynamic'
  | 'space'
  | 'nature'
  | 'cyberpunk'
  | 'fantasy'
  | 'experimental';

export type CameraEventType =
  | 'meteor-impact'
  | 'black-hole'
  | 'supernova'
  | 'lightning'
  | 'volcano-eruption'
  | 'portal-opening'
  | 'energy-explosion'
  | 'shockwave'
  | 'aurora-burst'
  | 'ocean-wave';

export interface AccessibilitySettings {
  reducedMotion: boolean;
  disableCameraShake: boolean;
  disableParallax: boolean;
  disableFlashEffects: boolean;
  lowMotionMode: boolean;
}

export interface CameraConfig {
  mode: CameraMode;
  speed: number;            // 0.2 to 3.0
  smoothness: number;       // 0.1 to 1.0 (interpolation damping factor)
  zoom: number;             // 0.5 to 3.0 (FOV / distance scaling)
  parallaxStrength: number; // 0.0 to 3.0
  shakeStrength: number;    // 0.0 to 2.5
  depthStrength: number;    // 0.0 to 2.5
  motionSensitivity: number;// 0.1 to 3.0
  orbitRadius: number;
  orbitHeight: number;
  fov: number;              // 30 to 90
}

export interface PostProcessingConfig {
  enabled: boolean;
  bloomEnabled: boolean;
  bloomThreshold: number;   // 0.2 to 1.0
  bloomIntensity: number;   // 0.0 to 3.0
  bloomRadius: number;      // 0.1 to 2.0
  motionBlurEnabled: boolean;
  motionBlurIntensity: number; // 0.0 to 1.0
  vignetteEnabled: boolean;
  vignetteDarkness: number; // 0.0 to 1.5
  vignetteOffset: number;   // 0.5 to 2.0
  chromaticAberration: number; // 0.0 to 0.02
  colorGradingEnabled: boolean;
  exposure: number;         // 0.5 to 2.0
  contrast: number;         // 0.5 to 2.0
  saturation: number;       // 0.0 to 2.0
  temperature: number;      // -1.0 (cool) to 1.0 (warm)
  tint: number;             // -1.0 (green) to 1.0 (magenta)
  filmGrain: number;        // 0.0 to 0.5
  atmosphereEnabled: boolean;
  atmosphereDensity: number;// 0.0 to 1.0
  depthHaze: number;        // 0.0 to 1.0
  distortionMode: 'none' | 'heat' | 'underwater' | 'portal';
  distortionIntensity: number; // 0.0 to 1.0
}

export interface CinematicState {
  cameraMode: CameraMode;
  preset: VisualPresetType;
  camera: CameraConfig;
  postProcessing: PostProcessingConfig;
  accessibility: AccessibilitySettings;
  isPlayingCinematic: boolean;
  cinematicProgress: number;
}

export interface DepthLayer {
  id: 'foreground' | 'midground' | 'background' | 'far-background';
  group: THREE.Group;
  parallaxMultiplier: number;
  depthOffset: number;
}
