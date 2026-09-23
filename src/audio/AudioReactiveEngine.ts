import * as THREE from 'three';
import {
  AudioAnalysisData,
  AudioReactiveConfig,
  AudioReactiveVisualTargets,
  WallpaperAudioProfileType,
} from './types';
import { AudioAnalyzer } from './AudioAnalyzer';
import { VisualAudioMapper } from './VisualAudioMapper';
import { GenerativeSoundEngine } from './GenerativeSoundEngine';
import { AudioReactiveBridge } from './AudioReactiveBridge';
import { QualityConfig } from '../types/engine';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { CinematicCameraEngine } from '../cinematic/CinematicCameraEngine';

export class AudioReactiveEngine {
  private analyzer: AudioAnalyzer;
  private mapper: VisualAudioMapper;
  private soundEngine: GenerativeSoundEngine;
  private bridge: AudioReactiveBridge;

  private currentTargets: AudioReactiveVisualTargets;
  private activeProfile: WallpaperAudioProfileType = 'cosmic';
  private quality: QualityConfig;

  // Real-time smoothing accumulator for camera to prevent snappy jumps
  private currentCameraDrift = { x: 0, y: 0, z: 0, zoom: 1.0 };

  constructor(
    analyzer: AudioAnalyzer,
    soundEngine: GenerativeSoundEngine,
    quality?: QualityConfig
  ) {
    this.analyzer = analyzer;
    this.soundEngine = soundEngine;
    this.mapper = new VisualAudioMapper();
    this.bridge = AudioReactiveBridge.getInstance();

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

    this.currentTargets = {
      particleScale: 1.0,
      galaxyPulse: 0.0,
      waveAmplitude: 1.0,
      bloomBoost: 0.0,
      auroraFlowSpeed: 1.0,
      sparksCountMultiplier: 1.0,
      crystalVibration: 0.0,
      shockwaveTrigger: false,
      cameraMicroDrift: { x: 0, y: 0, z: 0, zoom: 1.0 },
      gravityPulse: 0.0,
      vortexIntensity: 0.0,
      turbulenceBoost: 0.0,
    };
  }

  public setQuality(quality: QualityConfig): void {
    this.quality = quality;
    this.analyzer.applyQuality(quality);
  }

  public setActiveWallpaper(wallpaperId: string): void {
    this.activeProfile = this.mapper.matchProfileForWallpaper(wallpaperId);
  }

  public getVisualTargets(): AudioReactiveVisualTargets {
    return this.currentTargets;
  }

  /**
   * Main per-frame update loop
   */
  public update(
    delta: number,
    config: AudioReactiveConfig,
    activeWallpaperId?: string
  ): {
    analysis: AudioAnalysisData;
    targets: AudioReactiveVisualTargets;
  } {
    if (activeWallpaperId) {
      this.setActiveWallpaper(activeWallpaperId);
    }

    // If audio reactivity is turned off, return clean baseline targets
    if (!config.enabled) {
      this.resetTargets();
      return {
        analysis: this.analyzer.getCachedAnalysis(),
        targets: this.currentTargets,
      };
    }

    // Execute audio analysis
    const analysis = this.analyzer.analyze(config, delta);

    // If both local mic and generative sound are not active or no audio detected, idle cleanly
    if (!config.localAudioEnabled && !config.generativeSoundEnabled) {
      this.resetTargets();
      return {
        analysis,
        targets: this.currentTargets,
      };
    }

    // Compute visual targets for current wallpaper profile
    this.currentTargets = this.mapper.mapToTargets(analysis, config, this.activeProfile);

    // Apply smooth damping to camera drift (Prompt 8 integration)
    const rawCam = this.currentTargets.cameraMicroDrift;
    const lerpSpeed = Math.min(1.0, delta * 8.0);
    this.currentCameraDrift.x += (rawCam.x - this.currentCameraDrift.x) * lerpSpeed;
    this.currentCameraDrift.y += (rawCam.y - this.currentCameraDrift.y) * lerpSpeed;
    this.currentCameraDrift.z += (rawCam.z - this.currentCameraDrift.z) * lerpSpeed;
    this.currentCameraDrift.zoom += (rawCam.zoom - this.currentCameraDrift.zoom) * lerpSpeed;
    this.currentTargets.cameraMicroDrift = { ...this.currentCameraDrift };

    // Apply AUDIO -> CAMERA Reaction
    if (config.cameraReaction > 0.05 && analysis.isBeat) {
      try {
        const cinematic = CinematicCameraEngine.getInstance();
        if (cinematic) {
          const shakeMag = Math.min(0.3, analysis.beatConfidence * 0.25 * config.cameraReaction);
          cinematic.getShakeSystem().addTrauma(shakeMag);
        }
      } catch {}
    }

    // Apply AUDIO -> PHYSICS Reaction (Prompt 7 integration)
    if (config.physicsReaction > 0.05) {
      try {
        const physics = PhysicsEngine.getInstance();
        if (physics) {
          if (this.currentTargets.shockwaveTrigger) {
            physics.shockwaves.triggerShockwave({
              origin: new THREE.Vector3(0, 0, 0),
              strength: 2.5 * config.physicsReaction,
              maxRadius: 18.0,
              color: 0x00f0ff,
            });
          }
          if (this.currentTargets.gravityPulse > 0.2) {
            physics.forceFields.addForceField({
              type: 'gravity',
              position: new THREE.Vector3(0, 0, 0),
              strength: this.currentTargets.gravityPulse * 3.5,
              radius: 12.0,
              lifetime: 0.6,
            });
          }
        }
      } catch {}
    }

    // Forward to Android Bridge for native wallpaper hooks
    this.bridge.forwardAnalysisToNative(analysis, config);

    return {
      analysis,
      targets: this.currentTargets,
    };
  }

  private resetTargets(): void {
    this.currentTargets = {
      particleScale: 1.0,
      galaxyPulse: 0.0,
      waveAmplitude: 1.0,
      bloomBoost: 0.0,
      auroraFlowSpeed: 1.0,
      sparksCountMultiplier: 1.0,
      crystalVibration: 0.0,
      shockwaveTrigger: false,
      cameraMicroDrift: { x: 0, y: 0, z: 0, zoom: 1.0 },
      gravityPulse: 0.0,
      vortexIntensity: 0.0,
      turbulenceBoost: 0.0,
    };
    this.currentCameraDrift = { x: 0, y: 0, z: 0, zoom: 1.0 };
  }
}
