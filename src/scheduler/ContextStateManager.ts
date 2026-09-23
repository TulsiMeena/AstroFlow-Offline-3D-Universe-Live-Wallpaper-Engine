import { ContextState, AutomationMode } from './types';
import { PowerMode } from '../power/types';

export type ContextStateListener = (state: ContextState) => void;

export class ContextStateManager {
  private static instance: ContextStateManager;
  private state: ContextState;
  private listeners: Set<ContextStateListener> = new Set();

  private constructor() {
    this.state = {
      currentTime: '00:00:00',
      currentHour: 0,
      currentMinute: 0,
      dayOfWeek: 0,
      dayName: 'Sunday',
      isBatterySupported: false,
      batteryLevel: null,
      isCharging: null,
      batteryStatusMessage: 'Detecting...',
      isAppVisible: true,
      motionAvailable: true,
      audioAvailable: true,
      performanceTier: 'HIGH',
      powerMode: 'BALANCED',
      activeMode: 'NONE',
      activeRuleId: null,
      activeRuleName: null,
      activeWallpaperId: 'cosmic-particle-field',
      nextChangeTime: null,
      nextWallpaperId: null,
      nextWallpaperName: null,
      timeRemainingSeconds: null,
      activeConflicts: []
    };
  }

  public static getInstance(): ContextStateManager {
    if (!ContextStateManager.instance) {
      ContextStateManager.instance = new ContextStateManager();
    }
    return ContextStateManager.instance;
  }

  public getState(): ContextState {
    return { ...this.state };
  }

  public updateState(partial: Partial<ContextState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public subscribe(listener: ContextStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snap = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(snap);
      } catch (e) {
        console.warn('[ContextStateManager] Listener error', e);
      }
    });
  }
}
