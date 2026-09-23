import { QualityProfile } from '../types/engine';
import { PowerMode } from '../power/types';
import { RealDeviceBattery } from './DeviceStateAdapter';

export interface BatteryWorkloadProfile {
  powerMode: PowerMode;
  qualityProfile: QualityProfile;
  preferAmoled: boolean;
  recommendedCategory: string;
  particleMultiplier: number;
  reason: string;
}

export class BatteryAwareScheduler {
  /**
   * Computes recommended visual workload profile based purely on actual device battery status.
   * If battery is not supported, provides a safe balanced profile without fake claims.
   */
  public static evaluateProfile(
    battery: RealDeviceBattery,
    allowHighQualityWhileCharging: boolean,
    deviceGpuTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' = 'HIGH'
  ): BatteryWorkloadProfile {
    // 1. If battery is not supported by browser
    if (!battery.isSupported || battery.level === null) {
      return {
        powerMode: 'BALANCED',
        qualityProfile: deviceGpuTier === 'LOW' ? 'MEDIUM' : 'HIGH',
        preferAmoled: false,
        recommendedCategory: 'BALANCED',
        particleMultiplier: 1.0,
        reason: 'Device battery telemetry unavailable: operating in standard balanced mode.'
      };
    }

    const { level, charging } = battery;

    // 2. Charging State (Plugged in)
    if (charging && allowHighQualityWhileCharging) {
      return {
        powerMode: 'MAX_QUALITY',
        qualityProfile: deviceGpuTier === 'LOW' ? 'HIGH' : 'ULTRA',
        preferAmoled: false,
        recommendedCategory: 'ENERGY',
        particleMultiplier: 1.0,
        reason: 'Connected to external power: maximum procedural fidelity enabled.'
      };
    }

    // 3. Low Battery State (<= 20%)
    if (level <= 0.20) {
      return {
        powerMode: 'BATTERY_SAVER',
        qualityProfile: 'LOW',
        preferAmoled: true,
        recommendedCategory: 'AMOLED',
        particleMultiplier: 0.4,
        reason: `Battery level is at ${Math.round(level * 100)}%: workload reduced, AMOLED darkness prioritized.`
      };
    }

    // 4. Critical Low Battery (<= 10%)
    if (level <= 0.10) {
      return {
        powerMode: 'ULTRA_BATTERY_SAVER',
        qualityProfile: 'LOW',
        preferAmoled: true,
        recommendedCategory: 'AMOLED',
        particleMultiplier: 0.2,
        reason: `Battery level is critically low (${Math.round(level * 100)}%): minimal procedural draw active.`
      };
    }

    // 5. Normal / Balanced Battery (> 20%)
    return {
      powerMode: 'BALANCED',
      qualityProfile: deviceGpuTier === 'LOW' ? 'MEDIUM' : 'HIGH',
      preferAmoled: false,
      recommendedCategory: 'NATURE',
      particleMultiplier: 1.0,
      reason: `Battery normal (${Math.round(level * 100)}%): balanced procedural workload.`
    };
  }
}
