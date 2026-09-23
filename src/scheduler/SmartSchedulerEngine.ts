import {
  ContextState,
  SchedulerSettings,
  AutomationMode,
  TransitionType
} from './types';
import { ScheduleRuleManager } from './ScheduleRuleManager';
import { AutomationRuleEngine } from './AutomationRuleEngine';
import { ContextEngine } from './ContextEngine';
import { ContextStateManager } from './ContextStateManager';
import { ScheduleConflictManager } from './ScheduleConflictManager';
import { WallpaperRotationEngine } from './WallpaperRotationEngine';
import { WallpaperSetManager } from './WallpaperSetManager';
import { TransitionScheduler } from './TransitionScheduler';
import { BatteryAwareScheduler } from './BatteryAwareScheduler';
import { SchedulerHistoryManager } from './SchedulerHistoryManager';
import { SchedulerStorageManager } from './SchedulerStorageManager';
import { DeviceStateAdapter, AndroidContextBridge } from './DeviceStateAdapter';
import { WallpaperCatalog } from '../library/WallpaperCatalog';
import { TimeContextEngine } from './TimeContextEngine';

export type WallpaperChangeHandler = (
  wallpaperId: string,
  transition: TransitionType,
  duration: number
) => void;

export class SmartSchedulerEngine {
  private static instance: SmartSchedulerEngine;

  private scheduleRuleManager: ScheduleRuleManager;
  private automationRuleEngine: AutomationRuleEngine;
  private contextEngine: ContextEngine;
  private contextStateManager: ContextStateManager;
  private rotationEngine: WallpaperRotationEngine;
  private setManager: WallpaperSetManager;
  private transitionScheduler: TransitionScheduler;
  private historyManager: SchedulerHistoryManager;
  private deviceAdapter: DeviceStateAdapter;
  private androidBridge: AndroidContextBridge;

  private settings: SchedulerSettings;
  private tickIntervalId: any = null;
  private isRunning: boolean = false;
  private activeWallpaperId: string = 'cosmic-particle-field';
  private wallpaperChangeHandler: WallpaperChangeHandler | null = null;

  private constructor() {
    this.scheduleRuleManager = ScheduleRuleManager.getInstance();
    this.automationRuleEngine = AutomationRuleEngine.getInstance();
    this.contextEngine = ContextEngine.getInstance();
    this.contextStateManager = ContextStateManager.getInstance();
    this.rotationEngine = WallpaperRotationEngine.getInstance();
    this.setManager = WallpaperSetManager.getInstance();
    this.transitionScheduler = TransitionScheduler.getInstance();
    this.historyManager = SchedulerHistoryManager.getInstance();
    this.deviceAdapter = DeviceStateAdapter.getInstance();
    this.androidBridge = AndroidContextBridge.getInstance();

    this.settings = SchedulerStorageManager.loadSettings();

    // Hook rotation engine callback
    this.rotationEngine.setOnRotateCallback((nextId, reason) => {
      this.applyWallpaperChange(nextId, reason);
    });

    // Device state visibility hook
    this.deviceAdapter.subscribe({
      onVisibilityChange: (visible) => {
        if (!visible) {
          this.pause();
        } else {
          this.resume();
        }
      }
    });
  }

  public static getInstance(): SmartSchedulerEngine {
    if (!SmartSchedulerEngine.instance) {
      SmartSchedulerEngine.instance = new SmartSchedulerEngine();
    }
    return SmartSchedulerEngine.instance;
  }

  public init(initialWallpaperId: string, onWallpaperChange: WallpaperChangeHandler) {
    this.activeWallpaperId = initialWallpaperId;
    this.wallpaperChangeHandler = onWallpaperChange;

    this.contextStateManager.updateState({
      activeWallpaperId: initialWallpaperId
    });

    if (this.settings.enabled) {
      this.start();
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    // Trigger immediate evaluation
    this.tick();

    // Run lightweight 1-second cadence for time & countdown
    this.tickIntervalId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  public stop() {
    this.isRunning = false;
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    this.rotationEngine.stop();
  }

  public pause() {
    if (this.tickIntervalId !== null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
    this.rotationEngine.stop();
  }

  public resume() {
    if (this.isRunning && this.settings.enabled && this.tickIntervalId === null) {
      this.tick();
      this.tickIntervalId = setInterval(() => {
        this.tick();
      }, 1000);
    }
  }

  /**
   * Main evaluation loop tick (runs every second).
   */
  public tick() {
    const context = this.contextEngine.refreshContext();
    if (!this.settings.enabled) return;

    // 1. Evaluate Rule-based automations (Battery, Charging, Custom rules)
    if (this.settings.batteryRulesEnabled || this.settings.chargingRulesEnabled) {
      const matchedRules = this.automationRuleEngine.evaluateRules(context);

      if (matchedRules.length > 0) {
        const resolution = ScheduleConflictManager.resolve(
          matchedRules,
          this.settings.respectBatterySaver
        );

        if (resolution.winner) {
          const rule = resolution.winner;
          const throttleCheck = ScheduleConflictManager.canTriggerRule(rule);

          if (throttleCheck.allowed) {
            this.executeRuleAction(rule, resolution.reason);
            ScheduleConflictManager.recordTrigger(rule);
            return;
          }
        }
      }
    }

    // 2. Evaluate Time Schedule Slots
    if (this.settings.timeSchedulingEnabled) {
      const activeSlot = this.scheduleRuleManager.getActiveSlotForTime(
        context.currentHour,
        context.currentMinute,
        context.dayOfWeek
      );

      const nextInfo = this.scheduleRuleManager.getNextUpcomingSlot(
        context.currentHour,
        context.currentMinute,
        new Date().getSeconds(),
        context.dayOfWeek
      );

      // Compute display info for timeline/dashboard
      const nextWallpaperItem = nextInfo.nextSlot
        ? WallpaperCatalog.getItemById(nextInfo.nextSlot.targetWallpaperId)
        : null;

      const nextTimeFormatted = nextInfo.nextSlot
        ? `${String(nextInfo.nextSlot.startHour).padStart(2, '0')}:${String(nextInfo.nextSlot.startMinute).padStart(2, '0')}`
        : null;

      this.contextStateManager.updateState({
        nextChangeTime: nextTimeFormatted,
        nextWallpaperId: nextInfo.nextSlot?.targetWallpaperId || null,
        nextWallpaperName: nextWallpaperItem?.name || null,
        timeRemainingSeconds: nextInfo.secondsRemaining
      });

      if (activeSlot && activeSlot.targetWallpaperId !== this.activeWallpaperId) {
        this.applyWallpaperChange(
          activeSlot.targetWallpaperId,
          `Schedule Slot: ${activeSlot.name}`
        );
      }
    }
  }

  private executeRuleAction(rule: any, reason: string) {
    const { action } = rule;

    switch (action.type) {
      case 'ACTIVATE_WALLPAPER':
        if (action.targetId && action.targetId !== this.activeWallpaperId) {
          this.applyWallpaperChange(
            action.targetId,
            `Rule Trigger: ${rule.name}`,
            rule.id,
            action.transition,
            action.transitionDuration
          );
        }
        break;

      case 'ACTIVATE_SET':
        if (action.targetId) {
          const setWallpaper = this.setManager.getNextWallpaperInSet(action.targetId);
          if (setWallpaper && setWallpaper !== this.activeWallpaperId) {
            this.applyWallpaperChange(
              setWallpaper,
              `Rule Set: ${rule.name}`,
              rule.id,
              action.transition,
              action.transitionDuration
            );
          }
        }
        break;

      case 'SET_SPECIAL_MODE':
        if (action.targetId) {
          this.contextEngine.setSpecialMode(action.targetId as AutomationMode);
          const targetWp = this.contextEngine.getWallpaperForSpecialMode(action.targetId as AutomationMode);
          if (targetWp && targetWp !== this.activeWallpaperId) {
            this.applyWallpaperChange(
              targetWp,
              `Special Mode: ${action.targetId}`,
              rule.id,
              action.transition,
              action.transitionDuration
            );
          }
        }
        break;

      default:
        break;
    }
  }

  public applyWallpaperChange(
    targetWallpaperId: string,
    reason: string,
    ruleId?: string,
    transitionType?: TransitionType,
    transitionDuration?: number
  ) {
    if (targetWallpaperId === this.activeWallpaperId) return;

    const fromId = this.activeWallpaperId;
    const finalTransition = transitionType || this.settings.defaultTransition || 'crossfade';
    const finalDuration = transitionDuration ?? this.settings.defaultTransitionDuration ?? 1.0;

    const targetItem = WallpaperCatalog.getItemById(targetWallpaperId);
    const wallpaperName = targetItem?.name || targetWallpaperId;

    this.transitionScheduler.executeTransition(
      fromId,
      targetWallpaperId,
      finalTransition,
      finalDuration,
      () => {
        this.activeWallpaperId = targetWallpaperId;
        this.contextStateManager.updateState({
          activeWallpaperId: targetWallpaperId
        });

        // Notify app
        this.wallpaperChangeHandler?.(targetWallpaperId, finalTransition, finalDuration);

        // Record history
        this.historyManager.recordActivation(
          targetWallpaperId,
          wallpaperName,
          reason,
          ruleId,
          this.contextStateManager.getState().activeMode,
          finalDuration
        );

        // Notify Android Live Wallpaper Bridge
        this.androidBridge.notifyWallpaperChangedToNative(targetWallpaperId, wallpaperName);
      }
    );
  }

  // Settings & Configuration
  public getSettings(): SchedulerSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<SchedulerSettings>) {
    this.settings = { ...this.settings, ...partial };
    SchedulerStorageManager.saveSettings(this.settings);

    if (this.settings.enabled) {
      this.start();
    } else {
      this.stop();
    }

    if (partial.rotationMode || partial.defaultRotationIntervalMinutes) {
      this.rotationEngine.configure(
        this.settings.rotationMode,
        this.settings.defaultRotationIntervalMinutes
      );
    }
  }

  // Getters for subsystems
  public getScheduleRuleManager(): ScheduleRuleManager {
    return this.scheduleRuleManager;
  }

  public getAutomationRuleEngine(): AutomationRuleEngine {
    return this.automationRuleEngine;
  }

  public getWallpaperSetManager(): WallpaperSetManager {
    return this.setManager;
  }

  public getRotationEngine(): WallpaperRotationEngine {
    return this.rotationEngine;
  }

  public getContextStateManager(): ContextStateManager {
    return this.contextStateManager;
  }

  public getHistoryManager(): SchedulerHistoryManager {
    return this.historyManager;
  }

  public getTransitionScheduler(): TransitionScheduler {
    return this.transitionScheduler;
  }
}
