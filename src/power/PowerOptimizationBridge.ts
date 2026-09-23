import { PowerConfig, PowerMode, SensorPowerMode } from './types';

export interface AndroidPowerPayload {
  version: string;
  timestamp: number;
  engine: 'AmitHyperWall-PowerEngine';
  powerMode: PowerMode;
  targetFPS: number;
  motionEnabled: boolean;
  motionPowerMode: SensorPowerMode;
  audioEnabled: boolean;
  effectsQuality: 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW';
  particleQuality: 'MAX' | 'BALANCED' | 'SAVER' | 'MINIMAL';
  thermalProtection: boolean;
  amoledMode: boolean;
  resolutionScale: number;
  effects: {
    bloom: boolean;
    motionBlur: boolean;
    fog: boolean;
    postProcessing: boolean;
    ecosystem: boolean;
    weather: boolean;
  };
  androidServiceDirectives: {
    pauseWhenScreenOff: boolean;
    throttleWhenAppInBackground: boolean;
    allowSensorHighPrecision: boolean;
    batterySaverAutoThrottle: boolean;
  };
}

export class PowerOptimizationBridge {
  public static getAndroidPayload(config: PowerConfig): AndroidPowerPayload {
    let effectsQuality: 'ULTRA' | 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
    let particleQuality: 'MAX' | 'BALANCED' | 'SAVER' | 'MINIMAL' = 'BALANCED';

    if (config.mode === 'MAX_QUALITY') {
      effectsQuality = 'ULTRA';
      particleQuality = 'MAX';
    } else if (config.mode === 'BALANCED') {
      effectsQuality = 'HIGH';
      particleQuality = 'BALANCED';
    } else if (config.mode === 'BATTERY_SAVER') {
      effectsQuality = 'MEDIUM';
      particleQuality = 'SAVER';
    } else {
      effectsQuality = 'LOW';
      particleQuality = 'MINIMAL';
    }

    return {
      version: '1.1.0',
      timestamp: Date.now(),
      engine: 'AmitHyperWall-PowerEngine',
      powerMode: config.mode,
      targetFPS: config.targetFPS,
      motionEnabled: config.sensorMode !== 'OFF',
      motionPowerMode: config.sensorMode,
      audioEnabled: config.effects.audioReactive,
      effectsQuality,
      particleQuality,
      thermalProtection: config.thermalProtectionEnabled,
      amoledMode: config.amoledMode,
      resolutionScale: config.resolutionScale,
      effects: {
        bloom: config.effects.bloom,
        motionBlur: config.effects.motionBlur,
        fog: config.effects.fog,
        postProcessing: config.effects.postProcessing,
        ecosystem: config.effects.ecosystem,
        weather: config.effects.weather
      },
      androidServiceDirectives: {
        pauseWhenScreenOff: true,
        throttleWhenAppInBackground: true,
        allowSensorHighPrecision: config.sensorMode === 'HIGH',
        batterySaverAutoThrottle: true
      }
    };
  }
}
