import { QualityConfig, QualityProfile, GPUInfo } from '../types/engine';
import { PowerMode } from '../power/types';

export interface PerformanceTelemetryInput {
  fps: number;
  frameTime: number;
  particleCount: number;
  physicsEntities: number;
  powerMode: PowerMode;
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
}

export class QualityManager {
  private currentProfile: QualityProfile = 'HIGH';
  private config: QualityConfig;

  // Hysteresis & Cooldown tracking to prevent rapid quality flapping/oscillation
  private lastQualityChangeTime: number = 0;
  private readonly DOWNGRADE_COOLDOWN_MS: number = 2500;
  private readonly UPGRADE_COOLDOWN_MS: number = 8000;
  private consecutiveLowFpsSamples: number = 0;
  private consecutiveHighFpsSamples: number = 0;

  // Custom adaptive override levels within profile
  private adaptiveStep: number = 0; // 0 = standard profile, 1..6 = progressive workload shedding

  private static PROFILES: Record<QualityProfile, QualityConfig> = {
    LOW: {
      profile: 'LOW',
      resolutionScale: 0.75,
      maxParticleCount: 1500,
      shadows: false,
      bloomEnabled: false,
      postProcessing: false,
      animationComplexity: 0.6,
      antialias: false
    },
    MEDIUM: {
      profile: 'MEDIUM',
      resolutionScale: 1.0,
      maxParticleCount: 4000,
      shadows: false,
      bloomEnabled: false,
      postProcessing: true,
      animationComplexity: 0.9,
      antialias: true
    },
    HIGH: {
      profile: 'HIGH',
      resolutionScale: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1.5 : 1.5, 1.75),
      maxParticleCount: 10000,
      shadows: true,
      bloomEnabled: true,
      postProcessing: true,
      animationComplexity: 1.2,
      antialias: true
    },
    ULTRA: {
      profile: 'ULTRA',
      resolutionScale: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 2.0 : 2.0, 2.25),
      maxParticleCount: 22000,
      shadows: true,
      bloomEnabled: true,
      postProcessing: true,
      animationComplexity: 1.5,
      antialias: true
    }
  };

  constructor(initialProfile: QualityProfile = 'HIGH') {
    this.currentProfile = initialProfile;
    this.config = { ...QualityManager.PROFILES[initialProfile] };
  }

  public autoConfigure(gpu: GPUInfo): QualityProfile {
    let profile: QualityProfile = 'HIGH';
    if (gpu.tier === 'LOW') {
      profile = 'LOW';
    } else if (gpu.tier === 'MEDIUM') {
      profile = 'MEDIUM';
    } else {
      profile = 'HIGH';
    }
    this.setProfile(profile);
    return profile;
  }

  public setProfile(profile: QualityProfile): QualityConfig {
    this.currentProfile = profile;
    this.adaptiveStep = 0;
    this.config = { ...QualityManager.PROFILES[profile] };
    this.lastQualityChangeTime = performance.now();
    return this.config;
  }

  public getProfile(): QualityProfile {
    return this.currentProfile;
  }

  public getConfig(): QualityConfig {
    return { ...this.config };
  }

  /**
   * Evaluates runtime performance and applies fine-grained adaptive adjustments:
   * 1. Reduce particle count
   * 2. Reduce physics frequency
   * 3. Reduce post-processing
   * 4. Reduce shadow quality
   * 5. Reduce resolution scale
   * 6. Reduce simulation frequency
   * 7. Lower profile
   */
  public evaluatePerformance(telemetry: PerformanceTelemetryInput): { changed: boolean; config: QualityConfig } {
    const now = performance.now();
    const timeSinceChange = now - this.lastQualityChangeTime;

    // Check for thermal stress if genuine Navigator/device signals exist
    const isThermalStress = telemetry.thermalState === 'serious' || telemetry.thermalState === 'critical';

    // Battery saver mode forces low footprint
    if (telemetry.powerMode === 'ULTRA_BATTERY_SAVER' && this.currentProfile !== 'LOW') {
      this.setProfile('LOW');
      return { changed: true, config: this.getConfig() };
    }

    // Low performance criteria (< 30 FPS or frame time > 33ms or genuine thermal throttle)
    if ((telemetry.fps > 0 && telemetry.fps < 30) || telemetry.frameTime > 33.3 || isThermalStress) {
      this.consecutiveLowFpsSamples++;
      this.consecutiveHighFpsSamples = 0;

      if (this.consecutiveLowFpsSamples >= 3 && timeSinceChange > this.DOWNGRADE_COOLDOWN_MS) {
        this.consecutiveLowFpsSamples = 0;
        this.lastQualityChangeTime = now;

        // Progressive shedding
        if (this.adaptiveStep === 0) {
          // Step 1: Reduce particles by 35%
          this.config.maxParticleCount = Math.max(800, Math.floor(this.config.maxParticleCount * 0.65));
          this.adaptiveStep = 1;
        } else if (this.adaptiveStep === 1) {
          // Step 2 & 3: Turn off bloom / post-processing
          this.config.bloomEnabled = false;
          this.config.postProcessing = false;
          this.adaptiveStep = 2;
        } else if (this.adaptiveStep === 2) {
          // Step 4: Turn off shadows
          this.config.shadows = false;
          this.adaptiveStep = 3;
        } else if (this.adaptiveStep === 3) {
          // Step 5: Reduce resolution scale
          this.config.resolutionScale = Math.max(0.7, this.config.resolutionScale * 0.8);
          this.adaptiveStep = 4;
        } else if (this.adaptiveStep === 4) {
          // Step 6: Reduce animation/simulation complexity
          this.config.animationComplexity = Math.max(0.5, this.config.animationComplexity * 0.7);
          this.adaptiveStep = 5;
        } else {
          // Step 7: Lower profile completely
          if (this.currentProfile === 'ULTRA') this.setProfile('HIGH');
          else if (this.currentProfile === 'HIGH') this.setProfile('MEDIUM');
          else if (this.currentProfile === 'MEDIUM') this.setProfile('LOW');
        }
        return { changed: true, config: this.getConfig() };
      }
    } else if (telemetry.fps >= 55 && telemetry.frameTime < 18.0 && !isThermalStress) {
      this.consecutiveHighFpsSamples++;
      this.consecutiveLowFpsSamples = 0;

      // Stable recovery requires sustained high FPS for full upgrade cooldown
      if (this.consecutiveHighFpsSamples >= 10 && timeSinceChange > this.UPGRADE_COOLDOWN_MS) {
        this.consecutiveHighFpsSamples = 0;
        this.lastQualityChangeTime = now;

        // Gradually restore base profile config
        if (this.adaptiveStep > 0) {
          this.adaptiveStep = 0;
          this.config = { ...QualityManager.PROFILES[this.currentProfile] };
          return { changed: true, config: this.getConfig() };
        }
      }
    } else {
      this.consecutiveLowFpsSamples = Math.max(0, this.consecutiveLowFpsSamples - 1);
      this.consecutiveHighFpsSamples = Math.max(0, this.consecutiveHighFpsSamples - 1);
    }

    return { changed: false, config: this.getConfig() };
  }
}
