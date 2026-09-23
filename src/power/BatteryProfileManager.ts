import { PowerMode, PowerConfig, EffectPowerState, SmartFPSTarget, SensorPowerMode } from './types';

const STORAGE_KEY = 'amit_hyperwall_power_profile';

export class BatteryProfileManager {
  private static instance: BatteryProfileManager | null = null;
  private currentMode: PowerMode = 'BALANCED';
  private customConfig: PowerConfig;
  private listeners: ((config: PowerConfig) => void)[] = [];

  public static getInstance(): BatteryProfileManager {
    if (!BatteryProfileManager.instance) {
      BatteryProfileManager.instance = new BatteryProfileManager();
    }
    return BatteryProfileManager.instance;
  }

  constructor() {
    this.currentMode = this.loadSavedMode();
    this.customConfig = this.generateProfileConfig(this.currentMode);
  }

  private loadSavedMode(): PowerMode {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['MAX_QUALITY', 'BALANCED', 'BATTERY_SAVER', 'ULTRA_BATTERY_SAVER'].includes(saved)) {
        return saved as PowerMode;
      }
    } catch {
      // Fallback
    }
    return 'BALANCED';
  }

  public setMode(mode: PowerMode) {
    this.currentMode = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Storage unavailable
    }
    this.customConfig = this.generateProfileConfig(mode);
    this.notify();
  }

  public getMode(): PowerMode {
    return this.currentMode;
  }

  public getConfig(): PowerConfig {
    return { ...this.customConfig };
  }

  public updateConfig(partial: Partial<PowerConfig>) {
    this.customConfig = { ...this.customConfig, ...partial };
    this.notify();
  }

  public updateEffects(partial: Partial<EffectPowerState>) {
    this.customConfig.effects = { ...this.customConfig.effects, ...partial };
    this.notify();
  }

  public generateProfileConfig(mode: PowerMode): PowerConfig {
    switch (mode) {
      case 'MAX_QUALITY':
        return {
          mode: 'MAX_QUALITY',
          targetFPS: 60,
          currentCalculatedFPS: 60,
          smartFPSEnabled: true,
          idleThrottleEnabled: false, // Stay buttery smooth
          idleDurationSeconds: 15,
          amoledMode: false,
          thermalProtectionEnabled: true,
          sensorMode: 'HIGH',
          resolutionScale: 1.0,
          effects: {
            particles: true,
            physics: true,
            bloom: true,
            motionBlur: true,
            fog: true,
            postProcessing: true,
            audioReactive: true,
            ecosystem: true,
            weather: true,
            cameraEffects: true,
            particleScale: 1.0,
            physicsStepDivider: 1,
            ecosystemSimulationRadius: 80
          }
        };

      case 'BALANCED':
        return {
          mode: 'BALANCED',
          targetFPS: 60,
          currentCalculatedFPS: 60,
          smartFPSEnabled: true,
          idleThrottleEnabled: true,
          idleDurationSeconds: 6,
          amoledMode: false,
          thermalProtectionEnabled: true,
          sensorMode: 'NORMAL',
          resolutionScale: 1.0,
          effects: {
            particles: true,
            physics: true,
            bloom: true,
            motionBlur: false,
            fog: true,
            postProcessing: true,
            audioReactive: true,
            ecosystem: true,
            weather: true,
            cameraEffects: true,
            particleScale: 0.75,
            physicsStepDivider: 1,
            ecosystemSimulationRadius: 50
          }
        };

      case 'BATTERY_SAVER':
        return {
          mode: 'BATTERY_SAVER',
          targetFPS: 30,
          currentCalculatedFPS: 30,
          smartFPSEnabled: true,
          idleThrottleEnabled: true,
          idleDurationSeconds: 4,
          amoledMode: true,
          thermalProtectionEnabled: true,
          sensorMode: 'LOW',
          resolutionScale: 0.85,
          effects: {
            particles: true,
            physics: true,
            bloom: false,
            motionBlur: false,
            fog: true,
            postProcessing: false,
            audioReactive: true,
            ecosystem: true,
            weather: false,
            cameraEffects: false,
            particleScale: 0.45,
            physicsStepDivider: 2,
            ecosystemSimulationRadius: 30
          }
        };

      case 'ULTRA_BATTERY_SAVER':
        return {
          mode: 'ULTRA_BATTERY_SAVER',
          targetFPS: 20,
          currentCalculatedFPS: 20,
          smartFPSEnabled: true,
          idleThrottleEnabled: true,
          idleDurationSeconds: 2.5,
          amoledMode: true,
          thermalProtectionEnabled: true,
          sensorMode: 'OFF',
          resolutionScale: 0.75,
          effects: {
            particles: true,
            physics: true,
            bloom: false,
            motionBlur: false,
            fog: false,
            postProcessing: false,
            audioReactive: false,
            ecosystem: false,
            weather: false,
            cameraEffects: false,
            particleScale: 0.25,
            physicsStepDivider: 3,
            ecosystemSimulationRadius: 15
          }
        };
    }
  }

  public subscribe(fn: (config: PowerConfig) => void): () => void {
    this.listeners.push(fn);
    fn(this.getConfig());
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      fn(this.getConfig());
    }
  }
}
