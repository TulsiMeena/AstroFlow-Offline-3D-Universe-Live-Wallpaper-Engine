import * as THREE from 'three';
import {
  PowerConfig,
  PowerMode,
  SmartFPSTarget,
  SensorPowerMode,
  ThermalState,
  PowerMetrics,
  WorkloadLevel
} from './types';
import { BatteryManager } from './BatteryManager';
import { BatteryProfileManager } from './BatteryProfileManager';
import { SmartFPSManager } from './SmartFPSManager';
import { ThermalProtectionManager, ThermalRecommendations } from './ThermalProtectionManager';
import { RenderBudgetManager } from './RenderBudgetManager';
import { VisibilityManager, VisibilityState } from './VisibilityManager';
import { SensorPowerManager } from './SensorPowerManager';
import { EffectPowerManager } from './EffectPowerManager';
import { BatteryImpactEstimator } from './BatteryImpactEstimator';
import { PowerOptimizationBridge, AndroidPowerPayload } from './PowerOptimizationBridge';
import { MotionManager } from '../engine/MotionManager';
import { QualityProfile } from '../types/engine';

export class PowerOptimizationEngine {
  private static instance: PowerOptimizationEngine | null = null;

  private batteryManager: BatteryManager;
  private profileManager: BatteryProfileManager;
  private smartFPSManager: SmartFPSManager;
  private thermalManager: ThermalProtectionManager;
  private renderBudgetManager: RenderBudgetManager;
  private visibilityManager: VisibilityManager;
  private sensorPowerManager: SensorPowerManager;
  private effectPowerManager: EffectPowerManager;

  private isPausedByVisibility: boolean = false;
  private currentActualFPS: number = 60;
  private fpsCounter: number = 0;
  private fpsTimer: number = performance.now();
  private subscribers: ((metrics: PowerMetrics) => void)[] = [];

  public static getInstance(): PowerOptimizationEngine {
    if (!PowerOptimizationEngine.instance) {
      PowerOptimizationEngine.instance = new PowerOptimizationEngine();
    }
    return PowerOptimizationEngine.instance;
  }

  constructor() {
    this.batteryManager = BatteryManager.getInstance();
    this.profileManager = BatteryProfileManager.getInstance();
    this.smartFPSManager = new SmartFPSManager();
    this.thermalManager = new ThermalProtectionManager();
    this.renderBudgetManager = new RenderBudgetManager();
    this.visibilityManager = new VisibilityManager();
    this.sensorPowerManager = new SensorPowerManager();
    this.effectPowerManager = new EffectPowerManager();

    this.initCoordinators();
  }

  private initCoordinators() {
    // 1. Initial config sync from profile
    const initialConfig = this.profileManager.getConfig();
    this.applyConfig(initialConfig);

    // 2. Profile changes
    this.profileManager.subscribe(config => {
      this.applyConfig(config);
    });

    // 3. Visibility changes
    this.visibilityManager.subscribe((isVisible, state) => {
      this.isPausedByVisibility = !isVisible;
      if (!isVisible) {
        // Cut back sensors and physics when hidden
        this.sensorPowerManager.setMotionActive(false);
      } else {
        this.sensorPowerManager.setMotionActive(true);
        this.smartFPSManager.registerInteraction();
      }
    });

    // 4. Low battery auto-protection trigger
    this.batteryManager.setLowBatteryHandler(() => {
      if (this.profileManager.getMode() === 'MAX_QUALITY' || this.profileManager.getMode() === 'BALANCED') {
        this.setPowerMode('BATTERY_SAVER');
      }
    });

    // 5. Thermal protection recommendations
    this.thermalManager.subscribe((thermalState, recs) => {
      if (this.profileManager.getConfig().thermalProtectionEnabled) {
        if (recs.suggestedFPS) {
          this.smartFPSManager.setThermalThrottle(recs.suggestedFPS);
        } else {
          this.smartFPSManager.setThermalThrottle(null);
        }

        if (recs.particleScale < 1.0) {
          this.effectPowerManager.setState({
            particleScale: Math.min(this.profileManager.getConfig().effects.particleScale, recs.particleScale),
            physicsStepDivider: Math.max(this.profileManager.getConfig().effects.physicsStepDivider, recs.physicsDivider),
            bloom: !recs.disableBloom && this.profileManager.getConfig().effects.bloom,
            postProcessing: !recs.disablePostProcessing && this.profileManager.getConfig().effects.postProcessing
          });
        }
      }
    });
  }

  private applyConfig(config: PowerConfig) {
    this.smartFPSManager.setBaseTargetFPS(config.targetFPS);
    this.smartFPSManager.setIdleThreshold(config.idleDurationSeconds);
    this.sensorPowerManager.setMode(config.sensorMode);
    this.effectPowerManager.setState(config.effects);
    this.renderBudgetManager.setTargetFPS(config.targetFPS);
    this.renderBudgetManager.resetAdaptiveResolution(config.resolutionScale);
  }

  public attachContainer(container: HTMLElement, motionManager: MotionManager) {
    this.visibilityManager.attachElement(container);
    this.sensorPowerManager.attachMotionManager(motionManager);
  }

  public setPowerMode(mode: PowerMode) {
    this.profileManager.setMode(mode);
  }

  public getPowerMode(): PowerMode {
    return this.profileManager.getMode();
  }

  public getConfig(): PowerConfig {
    return this.profileManager.getConfig();
  }

  public toggleAmoledMode(): boolean {
    const current = this.profileManager.getConfig().amoledMode;
    const updated = !current;
    this.profileManager.updateConfig({ amoledMode: updated });
    return updated;
  }

  public setSensorMode(mode: SensorPowerMode) {
    this.profileManager.updateConfig({ sensorMode: mode });
  }

  public setThermalProtection(enabled: boolean) {
    this.profileManager.updateConfig({ thermalProtectionEnabled: enabled });
    if (!enabled) {
      this.smartFPSManager.setThermalThrottle(null);
    }
  }

  public autoOptimize(currentDna?: any) {
    // Intelligent auto-configuration based on real device context
    const battery = this.batteryManager.getBatteryInfo();
    const thermal = this.thermalManager.getState();

    if (battery.isSupported && battery.level !== null && battery.level <= 0.25 && !battery.charging) {
      this.setPowerMode('ULTRA_BATTERY_SAVER');
    } else if (thermal === 'CRITICAL') {
      this.setPowerMode('BATTERY_SAVER');
    } else if (thermal === 'ELEVATED') {
      this.setPowerMode('BALANCED');
    } else {
      this.setPowerMode('BALANCED');
    }
  }

  public registerInteraction() {
    this.smartFPSManager.registerInteraction();
  }

  /**
   * Called at the start of each animation loop step
   * Returns true if this frame should actually be computed and rendered
   */
  public shouldRenderFrame(now: number = performance.now()): boolean {
    if (this.isPausedByVisibility) return false;

    // Smart FPS throttle check
    this.smartFPSManager.update(now);
    const render = this.smartFPSManager.shouldRenderFrame(now);

    if (render) {
      // FPS measurement
      this.fpsCounter++;
      if (now - this.fpsTimer >= 1000) {
        this.currentActualFPS = Math.round((this.fpsCounter * 1000) / (now - this.fpsTimer));
        this.fpsCounter = 0;
        this.fpsTimer = now;
        this.notifyMetrics();
      }
    }

    return render;
  }

  /**
   * Record frame execution time for thermal and render budget management
   */
  public recordFrameTime(frameDurationMs: number) {
    this.thermalManager.recordFrameTime(frameDurationMs);
    const currentConfig = this.profileManager.getConfig();
    this.renderBudgetManager.evaluateFrameBudget(frameDurationMs, currentConfig.resolutionScale);
  }

  // Getters for subsystems
  public getBatteryManager(): BatteryManager {
    return this.batteryManager;
  }

  public getSmartFPSManager(): SmartFPSManager {
    return this.smartFPSManager;
  }

  public getThermalManager(): ThermalProtectionManager {
    return this.thermalManager;
  }

  public getRenderBudgetManager(): RenderBudgetManager {
    return this.renderBudgetManager;
  }

  public getVisibilityManager(): VisibilityManager {
    return this.visibilityManager;
  }

  public getSensorPowerManager(): SensorPowerManager {
    return this.sensorPowerManager;
  }

  public getEffectPowerManager(): EffectPowerManager {
    return this.effectPowerManager;
  }

  public getAndroidPayload(): AndroidPowerPayload {
    return PowerOptimizationBridge.getAndroidPayload(this.profileManager.getConfig());
  }

  public getMetrics(): PowerMetrics {
    const config = this.profileManager.getConfig();
    const effectiveFPS = this.smartFPSManager.getEffectiveFPS();
    const isIdle = this.smartFPSManager.getIsIdle();
    const thermal = this.thermalManager.getState();

    let workload: WorkloadLevel = 'LOW';
    if (config.mode === 'MAX_QUALITY') {
      workload = 'HIGH';
    } else if (config.mode === 'BALANCED') {
      workload = isIdle ? 'LOW' : 'MEDIUM';
    } else if (config.mode === 'BATTERY_SAVER') {
      workload = 'LOW';
    } else {
      workload = 'LOW';
    }

    return {
      currentFPS: this.currentActualFPS,
      targetFPS: effectiveFPS,
      powerMode: config.mode,
      thermalState: thermal,
      isIdle,
      idleTimeRemaining: isIdle ? 0 : 5,
      isVisible: !this.isPausedByVisibility,
      workloadLevel: workload,
      amoledActive: config.amoledMode,
      sensorMode: config.sensorMode,
      audioActive: config.effects.audioReactive,
      particleActiveBudget: Math.round(config.effects.particleScale * 100),
      physicsSubstep: config.effects.physicsStepDivider
    };
  }

  public subscribe(fn: (metrics: PowerMetrics) => void): () => void {
    this.subscribers.push(fn);
    fn(this.getMetrics());
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== fn);
    };
  }

  private notifyMetrics() {
    const metrics = this.getMetrics();
    for (const sub of this.subscribers) {
      sub(metrics);
    }
  }

  public dispose() {
    this.visibilityManager.dispose();
    this.batteryManager.dispose();
    this.subscribers = [];
  }
}
