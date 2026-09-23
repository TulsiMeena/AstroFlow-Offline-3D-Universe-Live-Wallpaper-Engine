import { RealBatteryInfo, PowerMode } from './types';

export class BatteryManager {
  private static instance: BatteryManager | null = null;
  private batteryInfo: RealBatteryInfo = {
    isSupported: false,
    level: null,
    charging: null,
    chargingTime: null,
    dischargingTime: null,
    statusMessage: 'Checking battery status...'
  };
  private rawBattery: any = null;
  private listeners: ((info: RealBatteryInfo) => void)[] = [];
  private onLowBatteryCallback: (() => void) | null = null;

  public static getInstance(): BatteryManager {
    if (!BatteryManager.instance) {
      BatteryManager.instance = new BatteryManager();
    }
    return BatteryManager.instance;
  }

  constructor() {
    this.initRealBattery();
  }

  private async initRealBattery() {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      try {
        const nav = navigator as any;
        this.rawBattery = await nav.getBattery();
        if (this.rawBattery) {
          this.updateFromRawBattery();

          this.rawBattery.addEventListener('levelchange', () => {
            this.updateFromRawBattery();
            this.checkLowBatteryThreshold();
          });
          this.rawBattery.addEventListener('chargingchange', () => {
            this.updateFromRawBattery();
          });
          return;
        }
      } catch (err) {
        // Battery API blocked or unsupported
      }
    }

    // Explicitly truthful fallback: NO FAKE DATA
    this.batteryInfo = {
      isSupported: false,
      level: null,
      charging: null,
      chargingTime: null,
      dischargingTime: null,
      statusMessage: 'Hardware Battery API restricted by browser sandbox. Algorithmic power budgeting active.'
    };
    this.notify();
  }

  private updateFromRawBattery() {
    if (!this.rawBattery) return;
    this.batteryInfo = {
      isSupported: true,
      level: typeof this.rawBattery.level === 'number' ? this.rawBattery.level : null,
      charging: typeof this.rawBattery.charging === 'boolean' ? this.rawBattery.charging : null,
      chargingTime: this.rawBattery.chargingTime ?? null,
      dischargingTime: this.rawBattery.dischargingTime ?? null,
      statusMessage: 'Connected to device Battery Manager API.'
    };
    this.notify();
  }

  private checkLowBatteryThreshold() {
    if (
      this.batteryInfo.level !== null &&
      this.batteryInfo.level <= 0.20 &&
      this.batteryInfo.charging === false
    ) {
      this.onLowBatteryCallback?.();
    }
  }

  public setLowBatteryHandler(callback: () => void) {
    this.onLowBatteryCallback = callback;
  }

  public getBatteryInfo(): RealBatteryInfo {
    return { ...this.batteryInfo };
  }

  public subscribe(fn: (info: RealBatteryInfo) => void): () => void {
    this.listeners.push(fn);
    fn(this.getBatteryInfo());
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      fn(this.getBatteryInfo());
    }
  }

  public dispose() {
    this.listeners = [];
    this.onLowBatteryCallback = null;
  }
}
