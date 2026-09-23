import { ContextState, AutomationMode } from './types';
import { TimeContextEngine } from './TimeContextEngine';
import { DayContextEngine } from './DayContextEngine';
import { ChargingContextEngine } from './ChargingContextEngine';
import { DeviceStateAdapter } from './DeviceStateAdapter';
import { ContextStateManager } from './ContextStateManager';
import { PowerMode } from '../power/types';

export class ContextEngine {
  private static instance: ContextEngine;
  private chargingEngine: ChargingContextEngine;
  private adapter: DeviceStateAdapter;
  private stateManager: ContextStateManager;
  private currentMode: AutomationMode = 'NONE';
  private currentPowerMode: PowerMode = 'BALANCED';

  private constructor() {
    this.chargingEngine = new ChargingContextEngine();
    this.adapter = DeviceStateAdapter.getInstance();
    this.stateManager = ContextStateManager.getInstance();

    // Listen for real device changes
    this.adapter.subscribe({
      onBatteryChange: () => this.refreshContext(),
      onVisibilityChange: () => this.refreshContext(),
      onReducedMotionChange: () => this.refreshContext()
    });
  }

  public static getInstance(): ContextEngine {
    if (!ContextEngine.instance) {
      ContextEngine.instance = new ContextEngine();
    }
    return ContextEngine.instance;
  }

  public setPowerMode(mode: PowerMode) {
    this.currentPowerMode = mode;
    this.refreshContext();
  }

  public setSpecialMode(mode: AutomationMode) {
    this.currentMode = mode;
    this.refreshContext();
  }

  public refreshContext(): ContextState {
    const timeInfo = TimeContextEngine.getCurrentLocalTime();
    const day = DayContextEngine.getCurrentDayOfWeek();
    const dayName = DayContextEngine.getDayName(day);
    const batteryInfo = this.chargingEngine.getBatteryInfo();
    const isVisible = this.adapter.getIsVisible();
    const motionAvailable = this.adapter.isMotionSensorAvailable();
    const audioAvailable = this.adapter.isAudioAvailable();

    // Infer automatic special mode if not manually set
    let inferredMode = this.currentMode;
    if (this.currentMode === 'NONE') {
      if (batteryInfo.isSupported && batteryInfo.level !== null && batteryInfo.level <= 0.20) {
        inferredMode = 'BATTERY_SAVER';
      } else if (batteryInfo.isSupported && batteryInfo.charging) {
        inferredMode = 'CHARGING';
      } else {
        const period = TimeContextEngine.getBuiltinPeriod(timeInfo.hours);
        if (period === 'MORNING') inferredMode = 'MORNING';
        else if (period === 'DAY') inferredMode = 'DAY';
        else if (period === 'EVENING') inferredMode = 'SUNSET';
        else inferredMode = 'NIGHT';
      }
    }

    const snapshot: Partial<ContextState> = {
      currentTime: timeInfo.formattedTime,
      currentHour: timeInfo.hours,
      currentMinute: timeInfo.minutes,
      dayOfWeek: day,
      dayName,
      isBatterySupported: batteryInfo.isSupported,
      batteryLevel: batteryInfo.level,
      isCharging: batteryInfo.charging,
      batteryStatusMessage: batteryInfo.statusMessage,
      isAppVisible: isVisible,
      motionAvailable,
      audioAvailable,
      performanceTier: 'HIGH',
      powerMode: this.currentPowerMode,
      activeMode: inferredMode
    };

    this.stateManager.updateState(snapshot);
    return this.stateManager.getState();
  }

  public getWallpaperForSpecialMode(mode: AutomationMode): string {
    switch (mode) {
      case 'MORNING':
        return 'aurora-borealis';
      case 'DAY':
        return 'cyber-grid';
      case 'SUNSET':
        return 'ocean-tide';
      case 'NIGHT':
        return 'galaxy-core';
      case 'BATTERY_SAVER':
        return 'black-hole'; // Dark AMOLED
      case 'CHARGING':
        return 'cosmic-particle-field'; // Energetic
      case 'RANDOM_UNIVERSE':
        return 'procedural-universe';
      default:
        return 'galaxy-core';
    }
  }
}
