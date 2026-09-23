import { QualityProfile } from '../types/engine';

export type PowerMode = 'MAX_QUALITY' | 'BALANCED' | 'BATTERY_SAVER' | 'ULTRA_BATTERY_SAVER';

export type SmartFPSTarget = 60 | 45 | 30 | 20 | 15;

export type SensorPowerMode = 'OFF' | 'LOW' | 'NORMAL' | 'HIGH';

export type ThermalState = 'NOMINAL' | 'ELEVATED' | 'CRITICAL';

export type WorkloadLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface EffectPowerState {
  particles: boolean;
  physics: boolean;
  bloom: boolean;
  motionBlur: boolean;
  fog: boolean;
  postProcessing: boolean;
  audioReactive: boolean;
  ecosystem: boolean;
  weather: boolean;
  cameraEffects: boolean;
  // Multipliers
  particleScale: number; // 0.1 to 1.0
  physicsStepDivider: number; // 1 = every frame, 2 = every 2nd frame, 4 = every 4th
  ecosystemSimulationRadius: number; // Max distance for full sim
}

export interface PowerConfig {
  mode: PowerMode;
  targetFPS: SmartFPSTarget;
  currentCalculatedFPS: SmartFPSTarget;
  smartFPSEnabled: boolean;
  idleThrottleEnabled: boolean;
  idleDurationSeconds: number; // Time before idle throttle
  amoledMode: boolean;
  thermalProtectionEnabled: boolean;
  sensorMode: SensorPowerMode;
  resolutionScale: number; // 0.5 to 1.0
  effects: EffectPowerState;
}

export interface RealBatteryInfo {
  isSupported: boolean;
  level: number | null; // 0.0 to 1.0 (real browser Battery API only)
  charging: boolean | null;
  chargingTime: number | null;
  dischargingTime: number | null;
  statusMessage: string;
}

export interface BatteryImpactAssessment {
  impact: WorkloadLevel;
  performanceLoad: WorkloadLevel;
  recommendedQuality: QualityProfile;
  score: number; // 0 to 100
  factors: {
    particles: number; // 0-100
    physics: number;
    postProcessing: number;
    animationComplexity: number;
    ecosystem: number;
    audio: number;
    sensors: number;
    resolution: number;
    fpsTarget: number;
  };
  suggestions: string[];
}

export interface PowerMetrics {
  currentFPS: number;
  targetFPS: SmartFPSTarget;
  powerMode: PowerMode;
  thermalState: ThermalState;
  isIdle: boolean;
  idleTimeRemaining: number;
  isVisible: boolean;
  workloadLevel: WorkloadLevel;
  amoledActive: boolean;
  sensorMode: SensorPowerMode;
  audioActive: boolean;
  particleActiveBudget: number;
  physicsSubstep: number;
}
