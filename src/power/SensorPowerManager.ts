import { SensorPowerMode } from './types';
import { MotionManager } from '../engine/MotionManager';

export class SensorPowerManager {
  private mode: SensorPowerMode = 'NORMAL';
  private motionManager: MotionManager | null = null;
  private lastUpdateTimestamp: number = 0;
  private minIntervalMs: number = 33; // ~30 FPS by default for NORMAL
  private isMotionActive: boolean = true;
  private listeners: ((mode: SensorPowerMode) => void)[] = [];

  constructor(motionManager?: MotionManager) {
    if (motionManager) {
      this.attachMotionManager(motionManager);
    }
    this.updateIntervals();
  }

  public attachMotionManager(manager: MotionManager) {
    this.motionManager = manager;
    this.applyModeToManager();
  }

  public setMode(mode: SensorPowerMode) {
    this.mode = mode;
    this.updateIntervals();
    this.applyModeToManager();
    this.notify();
  }

  public getMode(): SensorPowerMode {
    return this.mode;
  }

  public setMotionActive(active: boolean) {
    this.isMotionActive = active;
    if (this.motionManager) {
      this.motionManager.setEnabled(active && this.mode !== 'OFF');
    }
  }

  private updateIntervals() {
    switch (this.mode) {
      case 'OFF':
        this.minIntervalMs = 999999;
        break;
      case 'LOW':
        this.minIntervalMs = 66.6; // ~15 Hz
        break;
      case 'NORMAL':
        this.minIntervalMs = 33.3; // ~30 Hz
        break;
      case 'HIGH':
        this.minIntervalMs = 16.6; // ~60 Hz
        break;
    }
  }

  private applyModeToManager() {
    if (!this.motionManager) return;

    if (this.mode === 'OFF' || !this.isMotionActive) {
      this.motionManager.setEnabled(false);
    } else {
      this.motionManager.setEnabled(true);
      if (this.mode === 'LOW') {
        this.motionManager.setReducedMotion(true);
        this.motionManager.setSmoothing(0.05); // Less frequent heavy interpolation
      } else if (this.mode === 'NORMAL') {
        this.motionManager.setReducedMotion(false);
        this.motionManager.setSmoothing(0.1);
      } else if (this.mode === 'HIGH') {
        this.motionManager.setReducedMotion(false);
        this.motionManager.setSmoothing(0.18);
      }
    }
  }

  /**
   * Gates sensor polling frequency in main render loop
   */
  public shouldUpdateSensors(now: number = performance.now()): boolean {
    if (this.mode === 'OFF' || !this.isMotionActive) return false;
    if (now - this.lastUpdateTimestamp >= this.minIntervalMs) {
      this.lastUpdateTimestamp = now;
      return true;
    }
    return false;
  }

  public subscribe(fn: (mode: SensorPowerMode) => void): () => void {
    this.listeners.push(fn);
    fn(this.mode);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      fn(this.mode);
    }
  }
}
