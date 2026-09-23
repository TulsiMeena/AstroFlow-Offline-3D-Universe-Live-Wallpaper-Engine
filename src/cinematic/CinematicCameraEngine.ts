import * as THREE from 'three';
import {
  CameraConfig,
  CameraMode,
  PostProcessingConfig,
  VisualPresetType,
  CameraEventType,
  AccessibilitySettings,
  CinematicState,
} from './types';
import { CameraDirector } from './CameraDirector';
import { CameraPathSystem } from './CameraPathSystem';
import { CameraShakeSystem } from './CameraShakeSystem';
import { DepthLayerManager } from './DepthLayerManager';
import { PostProcessingEngine } from './PostProcessingEngine';
import { VisualPresetManager } from './VisualPresetManager';
import { QualityConfig, MotionData, TouchPointerState } from '../types/engine';

export class CinematicCameraEngine {
  private static instance: CinematicCameraEngine | null = null;

  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private quality: QualityConfig;

  // Subsystems
  private pathSystem: CameraPathSystem;
  private shakeSystem: CameraShakeSystem;
  private director: CameraDirector;
  private depthManager: DepthLayerManager;
  private presetManager: VisualPresetManager;
  private postProcessing: PostProcessingEngine | null = null;

  // State
  private state: CinematicState;
  private listeners: ((state: CinematicState) => void)[] = [];

  public static getInstance(camera?: THREE.PerspectiveCamera, quality?: QualityConfig): CinematicCameraEngine {
    if (!CinematicCameraEngine.instance && camera) {
      CinematicCameraEngine.instance = new CinematicCameraEngine(camera, quality);
    }
    return CinematicCameraEngine.instance!;
  }

  constructor(camera: THREE.PerspectiveCamera, quality?: QualityConfig) {
    this.camera = camera;
    this.quality = quality || {
      profile: 'HIGH',
      resolutionScale: 1.0,
      maxParticleCount: 2400,
      shadows: true,
      bloomEnabled: true,
      postProcessing: true,
      animationComplexity: 1.0,
      antialias: true,
    };

    this.pathSystem = new CameraPathSystem();
    this.shakeSystem = new CameraShakeSystem();
    this.director = new CameraDirector(this.camera, this.pathSystem, this.shakeSystem);
    this.depthManager = new DepthLayerManager();
    this.presetManager = new VisualPresetManager('cinematic');

    const defaultPreset = this.presetManager.getPreset('cinematic')!;

    this.state = {
      cameraMode: defaultPreset.camera.mode || 'cinematic',
      preset: 'cinematic',
      camera: {
        mode: defaultPreset.camera.mode || 'cinematic',
        speed: defaultPreset.camera.speed || 1.0,
        smoothness: defaultPreset.camera.smoothness || 0.65,
        zoom: defaultPreset.camera.zoom || 1.0,
        parallaxStrength: defaultPreset.camera.parallaxStrength || 1.0,
        shakeStrength: defaultPreset.camera.shakeStrength || 1.0,
        depthStrength: defaultPreset.camera.depthStrength || 1.0,
        motionSensitivity: defaultPreset.camera.motionSensitivity || 1.0,
        orbitRadius: 5.5,
        orbitHeight: 1.5,
        fov: defaultPreset.camera.fov || 55,
      },
      postProcessing: {
        enabled: true,
        bloomEnabled: true,
        bloomThreshold: 0.65,
        bloomIntensity: 1.25,
        bloomRadius: 1.1,
        motionBlurEnabled: true,
        motionBlurIntensity: 0.45,
        vignetteEnabled: true,
        vignetteDarkness: 0.85,
        vignetteOffset: 1.1,
        chromaticAberration: 0.003,
        colorGradingEnabled: true,
        exposure: 1.05,
        contrast: 1.08,
        saturation: 1.12,
        temperature: 0.05,
        tint: -0.02,
        filmGrain: 0.02,
        atmosphereEnabled: true,
        atmosphereDensity: 0.65,
        depthHaze: 0.5,
        distortionMode: 'none',
        distortionIntensity: 0.0,
      },
      accessibility: {
        reducedMotion: false,
        disableCameraShake: false,
        disableParallax: false,
        disableFlashEffects: false,
        lowMotionMode: false,
      },
      isPlayingCinematic: true,
      cinematicProgress: 0,
    };

    CinematicCameraEngine.instance = this;
  }

  public initRenderer(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    if (this.postProcessing) {
      this.postProcessing.dispose();
    }
    this.postProcessing = new PostProcessingEngine(renderer, this.quality);
  }

  public getDepthManager(): DepthLayerManager {
    return this.depthManager;
  }

  public getDirector(): CameraDirector {
    return this.director;
  }

  public getShakeSystem(): CameraShakeSystem {
    return this.shakeSystem;
  }

  public getPostProcessing(): PostProcessingEngine | null {
    return this.postProcessing;
  }

  public getState(): CinematicState {
    return this.state;
  }

  public subscribe(fn: (state: CinematicState) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify(): void {
    for (const fn of this.listeners) {
      fn(this.state);
    }
  }

  public updateCameraConfig(partial: Partial<CameraConfig>): void {
    this.state.camera = { ...this.state.camera, ...partial };
    if (partial.mode) {
      this.state.cameraMode = partial.mode;
    }
    this.notify();
  }

  public updatePostProcessingConfig(partial: Partial<PostProcessingConfig>): void {
    this.state.postProcessing = { ...this.state.postProcessing, ...partial };
    this.notify();
  }

  public updateAccessibility(partial: Partial<AccessibilitySettings>): void {
    this.state.accessibility = { ...this.state.accessibility, ...partial };
    if (this.state.accessibility.lowMotionMode) {
      this.state.accessibility.reducedMotion = true;
      this.state.accessibility.disableCameraShake = true;
      this.state.accessibility.disableParallax = true;
    }
    this.notify();
  }

  public setCameraMode(mode: CameraMode): void {
    this.state.cameraMode = mode;
    this.state.camera.mode = mode;
    this.notify();
  }

  public setPreset(presetId: VisualPresetType): void {
    const preset = this.presetManager.setPreset(presetId);
    if (!preset) return;

    this.state.preset = presetId;
    if (preset.camera) {
      this.state.camera = { ...this.state.camera, ...preset.camera };
      if (preset.camera.mode) {
        this.state.cameraMode = preset.camera.mode;
      }
    }
    if (preset.postProcessing) {
      this.state.postProcessing = { ...this.state.postProcessing, ...preset.postProcessing };
    }
    this.notify();
  }

  public playCinematic(): void {
    this.state.isPlayingCinematic = true;
    this.setCameraMode('cinematic');
    this.pathSystem.generatePath('orbit-spiral');
    this.notify();
  }

  public randomizeCamera(): void {
    const modes: CameraMode[] = [
      'cinematic',
      'orbit',
      'fly',
      'macro',
      'planet',
      'galaxy',
      'portal',
      'infinite-zoom',
    ];
    const pickedMode = modes[Math.floor(Math.random() * modes.length)];
    const speed = 0.6 + Math.random() * 1.2;
    const zoom = 0.8 + Math.random() * 0.8;
    const smoothness = 0.4 + Math.random() * 0.5;

    this.updateCameraConfig({
      mode: pickedMode,
      speed,
      zoom,
      smoothness,
    });
  }

  public resetCamera(): void {
    this.director.resetCamera();
    this.setPreset('cinematic');
  }

  public handleEvent(event: CameraEventType, intensity: number = 1.0): void {
    this.director.handleEvent(event, intensity, this.state.accessibility);
  }

  public setQuality(quality: QualityConfig): void {
    this.quality = quality;
    if (this.postProcessing) {
      this.postProcessing.setQuality(quality);
    }
  }

  public setDynamicThrottle(throttle: boolean): void {
    if (this.postProcessing) {
      this.postProcessing.setDynamicThrottle(throttle);
    }
  }

  public resize(width: number, height: number): void {
    if (this.postProcessing) {
      this.postProcessing.setSize(width, height);
    }
  }

  /**
   * Main cinematic update & render step
   */
  public update(
    delta: number,
    time: number,
    motion?: MotionData,
    input?: TouchPointerState
  ): void {
    // 1. Update Camera movement & physics shake
    this.director.update(
      delta,
      time,
      this.state.camera,
      motion,
      input,
      this.state.accessibility
    );

    // 2. Update Depth Layers Parallax
    this.depthManager.update(
      delta,
      motion,
      input,
      this.state.camera.parallaxStrength,
      this.state.camera.depthStrength,
      this.state.accessibility
    );

    this.state.cinematicProgress = this.pathSystem.getProgress();
  }

  /**
   * Post-processing render step
   */
  public render(scene: THREE.Scene): void {
    if (!this.postProcessing) {
      this.renderer?.render(scene, this.camera);
      return;
    }

    const delta = 0.016;
    const time = performance.now() * 0.001;

    this.postProcessing.render(
      scene,
      this.camera,
      time,
      delta,
      this.state.postProcessing,
      this.state.accessibility
    );
  }

  public dispose(): void {
    this.postProcessing?.dispose();
    this.depthManager.dispose();
  }
}
