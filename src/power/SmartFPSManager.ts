import { SmartFPSTarget, PowerMode } from './types';

export class SmartFPSManager {
  private baseTargetFPS: SmartFPSTarget = 60;
  private currentEffectiveFPS: SmartFPSTarget = 60;
  private lastRenderTimestamp: number = 0;
  private lastInteractionTimestamp: number = performance.now();
  private idleThresholdMs: number = 5000;
  private isIdle: boolean = false;
  private thermalThrottleFPS: SmartFPSTarget | null = null;
  private listeners: ((fps: SmartFPSTarget, isIdle: boolean) => void)[] = [];

  constructor() {
    this.lastRenderTimestamp = performance.now();
  }

  public setBaseTargetFPS(fps: SmartFPSTarget) {
    this.baseTargetFPS = fps;
    this.recomputeEffectiveFPS();
  }

  public setIdleThreshold(seconds: number) {
    this.idleThresholdMs = Math.max(1000, seconds * 1000);
  }

  public registerInteraction() {
    const now = performance.now();
    this.lastInteractionTimestamp = now;
    if (this.isIdle) {
      this.isIdle = false;
      this.recomputeEffectiveFPS();
    }
  }

  public setThermalThrottle(throttleFPS: SmartFPSTarget | null) {
    this.thermalThrottleFPS = throttleFPS;
    this.recomputeEffectiveFPS();
  }

  public update(now: number = performance.now()): { effectiveFPS: SmartFPSTarget; isIdle: boolean } {
    // Check if idle
    const elapsedSinceInteraction = now - this.lastInteractionTimestamp;
    const nowIdle = elapsedSinceInteraction > this.idleThresholdMs;

    if (nowIdle !== this.isIdle) {
      this.isIdle = nowIdle;
      this.recomputeEffectiveFPS();
    }

    return {
      effectiveFPS: this.currentEffectiveFPS,
      isIdle: this.isIdle
    };
  }

  private recomputeEffectiveFPS() {
    let target = this.baseTargetFPS;

    // Apply thermal throttle if active
    if (this.thermalThrottleFPS !== null && this.thermalThrottleFPS < target) {
      target = this.thermalThrottleFPS;
    }

    // Apply idle down-stepping
    if (this.isIdle) {
      if (target >= 60) {
        target = 30; // 60 -> 30 when idle
      } else if (target === 45) {
        target = 30;
      } else if (target === 30) {
        target = 20; // 30 -> 20 when idle in battery saver
      } else {
        target = 15; // 20 -> 15 in ultra saver
      }
    }

    if (this.currentEffectiveFPS !== target) {
      this.currentEffectiveFPS = target;
      this.notify();
    }
  }

  /**
   * Deterministic frame-pacing check to prevent micro-stutters
   */
  public shouldRenderFrame(now: number = performance.now()): boolean {
    const targetIntervalMs = 1000 / this.currentEffectiveFPS;
    const elapsed = now - this.lastRenderTimestamp;

    // Generous sub-millisecond tolerance for 60Hz display refresh sync (e.g. 15.5ms for 16.6ms)
    if (elapsed >= targetIntervalMs - 1.5) {
      this.lastRenderTimestamp = now;
      return true;
    }
    return false;
  }

  public getEffectiveFPS(): SmartFPSTarget {
    return this.currentEffectiveFPS;
  }

  public getBaseTargetFPS(): SmartFPSTarget {
    return this.baseTargetFPS;
  }

  public getIsIdle(): boolean {
    return this.isIdle;
  }

  public subscribe(fn: (fps: SmartFPSTarget, isIdle: boolean) => void): () => void {
    this.listeners.push(fn);
    fn(this.currentEffectiveFPS, this.isIdle);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      fn(this.currentEffectiveFPS, this.isIdle);
    }
  }
}
