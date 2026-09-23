import { DeviceStateAdapter } from './DeviceStateAdapter';

export class SchedulerPerformanceManager {
  private static instance: SchedulerPerformanceManager;
  private isTabVisible: boolean = true;
  private activeTimers: Set<any> = new Set();
  private cleanupHooks: Set<() => void> = new Set();

  private constructor() {
    const adapter = DeviceStateAdapter.getInstance();
    this.isTabVisible = adapter.getIsVisible();

    adapter.subscribe({
      onVisibilityChange: (visible) => {
        this.isTabVisible = visible;
        if (!visible) {
          this.pauseAllBackgroundActivity();
        } else {
          this.resumeForegroundActivity();
        }
      }
    });
  }

  public static getInstance(): SchedulerPerformanceManager {
    if (!SchedulerPerformanceManager.instance) {
      SchedulerPerformanceManager.instance = new SchedulerPerformanceManager();
    }
    return SchedulerPerformanceManager.instance;
  }

  public registerTimer(timerId: any): any {
    this.activeTimers.add(timerId);
    return timerId;
  }

  public clearTimer(timerId: any) {
    clearInterval(timerId);
    clearTimeout(timerId);
    this.activeTimers.delete(timerId);
  }

  public registerCleanupHook(fn: () => void): () => void {
    this.cleanupHooks.add(fn);
    return () => this.cleanupHooks.delete(fn);
  }

  private pauseAllBackgroundActivity() {
    // Notify all listeners to suspend background GPU tasks
  }

  private resumeForegroundActivity() {
    // Resume standard operations
  }

  public cleanupAll() {
    this.activeTimers.forEach((timer) => {
      clearInterval(timer);
      clearTimeout(timer);
    });
    this.activeTimers.clear();

    this.cleanupHooks.forEach((hook) => {
      try {
        hook();
      } catch (e) {
        console.warn('[SchedulerPerformance] Error during cleanup hook', e);
      }
    });
  }

  public getIsTabVisible(): boolean {
    return this.isTabVisible;
  }
}
