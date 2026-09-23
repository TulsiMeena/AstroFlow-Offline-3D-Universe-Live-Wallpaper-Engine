import { DeviceStateAdapter, RealDeviceBattery } from './DeviceStateAdapter';

export class ChargingContextEngine {
  private adapter: DeviceStateAdapter;

  constructor() {
    this.adapter = DeviceStateAdapter.getInstance();
  }

  public getBatteryInfo(): RealDeviceBattery {
    return this.adapter.getBatteryInfo();
  }

  public isBatterySupported(): boolean {
    return this.adapter.getBatteryInfo().isSupported;
  }

  public isCharging(): boolean | null {
    return this.adapter.getBatteryInfo().charging;
  }

  public getBatteryLevel(): number | null {
    return this.adapter.getBatteryInfo().level;
  }

  public isLowBattery(threshold: number = 0.20): boolean {
    const level = this.getBatteryLevel();
    if (level === null) return false;
    return level <= threshold;
  }

  public isHighBattery(threshold: number = 0.80): boolean {
    const level = this.getBatteryLevel();
    if (level === null) return false;
    return level >= threshold;
  }

  public getStatusSummary(): {
    supported: boolean;
    levelPercent: number | null;
    charging: boolean | null;
    message: string;
  } {
    const info = this.getBatteryInfo();
    return {
      supported: info.isSupported,
      levelPercent: info.level !== null ? Math.round(info.level * 100) : null,
      charging: info.charging,
      message: info.statusMessage
    };
  }
}
