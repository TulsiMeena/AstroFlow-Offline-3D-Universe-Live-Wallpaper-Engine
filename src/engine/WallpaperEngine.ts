import * as THREE from 'three';
import { EngineRenderer } from './Renderer';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import { LightingManager } from './LightingManager';
import { EffectManager } from './EffectManager';
import { InputManager } from './InputManager';
import { MotionManager } from './MotionManager';
import { PerformanceManager } from './PerformanceManager';
import { QualityManager } from './QualityManager';
import { WallpaperRegistry } from './WallpaperRegistry';
import { InteractionField } from './physics/InteractionField';
import { RippleField } from './physics/RippleField';
import { EnergyReactionSystem } from './physics/EnergyReactionSystem';
import { GravityManager } from './physics/GravityManager';
import { ParallaxManager } from './physics/ParallaxManager';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { CinematicCameraEngine } from '../cinematic/CinematicCameraEngine';
import { AudioEngine } from '../audio/AudioEngine';
import { PowerOptimizationEngine } from '../power/PowerOptimizationEngine';
import { DiagnosticManager } from '../diagnostics/DiagnosticManager';
import { AndroidWallpaperBridge } from '../android/AndroidWallpaperBridge';
import { ResourceDisposal } from '../utils/resourceDisposal';
import { IWallpaper, WallpaperUpdateContext } from '../types/wallpaper';
import { EngineCallbacks, QualityProfile, MotionEventType, MotionCalibrationSettings } from '../types/engine';

export class WallpaperEngine {
  private renderer: EngineRenderer;
  private sceneManager: SceneManager;
  private cameraManager: CameraManager;
  private lightingManager: LightingManager;
  private effectManager: EffectManager;
  private inputManager: InputManager;
  private motionManager: MotionManager;
  private performanceManager: PerformanceManager;
  private qualityManager: QualityManager;
  private registry: WallpaperRegistry;

  // Physics & Interaction Subsystems
  private interactionField: InteractionField;
  private rippleField: RippleField;
  private energyReaction: EnergyReactionSystem;
  private gravityManager: GravityManager;
  private parallaxManager: ParallaxManager;
  private physicsEngine: PhysicsEngine;
  private cinematicEngine: CinematicCameraEngine;
  private audioEngine: AudioEngine;
  private powerEngine: PowerOptimizationEngine;

  private activeWallpaper: IWallpaper | null = null;
  private activeWallpaperId: string = 'cosmic-particle-field';

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;
  private clock: THREE.Clock;
  private callbacks: EngineCallbacks = {};
  private containerElement: HTMLElement | null = null;
  private boundVisibilityChange = this.handleVisibilityChange.bind(this);
  private boundResize = this.handleResize.bind(this);
  private unsubscribeMotionEvent: (() => void) | null = null;

  constructor(callbacks: EngineCallbacks = {}, initialQuality: QualityProfile = 'HIGH') {
    this.callbacks = callbacks;
    this.clock = new THREE.Clock();

    this.powerEngine = PowerOptimizationEngine.getInstance();
    this.qualityManager = new QualityManager(initialQuality);
    this.renderer = new EngineRenderer();
    this.sceneManager = new SceneManager();
    this.cameraManager = new CameraManager();
    this.lightingManager = new LightingManager();
    this.effectManager = new EffectManager();
    this.inputManager = new InputManager();
    this.motionManager = new MotionManager();
    this.registry = WallpaperRegistry.getInstance();

    // Initialize Physics & Interaction Subsystems
    this.interactionField = new InteractionField({ mode: 'attraction', strength: 1.2, radius: 5.0 });
    this.rippleField = new RippleField(8);
    this.energyReaction = new EnergyReactionSystem();
    this.gravityManager = new GravityManager();
    this.parallaxManager = new ParallaxManager();
    this.physicsEngine = PhysicsEngine.getInstance(this.qualityManager.getConfig());
    this.cinematicEngine = CinematicCameraEngine.getInstance(this.cameraManager.getCamera(), this.qualityManager.getConfig());
    this.audioEngine = AudioEngine.getInstance(this.qualityManager.getConfig());

    // Subscribe to Motion Events (Shake, Tilt, Burst)
    this.unsubscribeMotionEvent = this.motionManager.subscribeToEvents(this.handleMotionEvent.bind(this));

    this.performanceManager = new PerformanceManager(() => {
      // Sustained low FPS detected -> Automatically downgrade quality by one step
      const current = this.qualityManager.getProfile();
      if (current === 'ULTRA') this.setQuality('HIGH');
      else if (current === 'HIGH') this.setQuality('MEDIUM');
      else if (current === 'MEDIUM') this.setQuality('LOW');
    });

    // Auto-configure according to GPU tier
    const gpu = this.performanceManager.getGPUInfo();
    this.qualityManager.autoConfigure(gpu);
  }

  private handleMotionEvent(event: MotionEventType) {
    this.callbacks.onMotionEvent?.(event);

    // Physical reactions based on motion event
    if (event === 'SHAKE') {
      this.energyReaction.triggerPulse(0, 0, 0, 1.8, 0x00ffff);
      this.rippleField.spawnRipple(0, 0, 1.5, 5.0, 12.0);
      this.interactionField.configure({
        mode: 'repulsion',
        strength: 2.5,
        radius: 12.0,
        duration: 0.8
      });
    } else if (event === 'ACCELERATION_BURST') {
      this.energyReaction.triggerPulse(0, 0, 0, 1.2, 0xff00aa);
    } else if (event === 'FAST_TILT') {
      this.interactionField.configure({
        mode: 'vortex',
        strength: 1.5,
        radius: 8.0,
        duration: 0.6
      });
    }
  }

  public init(canvas: HTMLCanvasElement, container: HTMLElement): boolean {
    this.containerElement = container;

    this.renderer.setContextCallbacks(
      () => {
        this.callbacks.onError?.('WebGL Context was lost. Attempting recovery...');
      },
      () => {
        if (this.containerElement) {
          const scene = this.sceneManager.getScene();
          const camera = this.cameraManager.getCamera();
          const quality = this.qualityManager.getConfig();
          if (this.activeWallpaper) {
            this.activeWallpaper.init(scene, camera, quality);
          }
        }
      }
    );

    const qualityConfig = this.qualityManager.getConfig();
    const success = this.renderer.init(canvas, qualityConfig);
    if (!success) {
      this.callbacks.onError?.('WebGL is not supported or encountered a GPU context failure.');
      return false;
    }

    const scene = this.sceneManager.getScene();
    this.lightingManager.attachToScene(scene);
    this.lightingManager.configureQuality(qualityConfig);
    this.effectManager.init(scene, qualityConfig);
    this.energyReaction.attachToScene(scene);
    this.physicsEngine.attachToScene(scene);

    const webglRenderer = this.renderer.getWebGLRenderer();
    if (webglRenderer) {
      this.cinematicEngine.initRenderer(webglRenderer);
    }
    scene.add(this.cinematicEngine.getDepthManager().getRootGroup());

    this.inputManager.attach(container);
    this.powerEngine.attachContainer(container, this.motionManager);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.handleResizeDimensions(width, height);

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundVisibilityChange);
      window.addEventListener('resize', this.boundResize, { passive: true });
    }

    // Load active wallpaper
    this.loadWallpaper(this.activeWallpaperId);
    this.start();

    return true;
  }

  public loadWallpaper(wallpaperId: string): boolean {
    const wallpaper = this.registry.createWallpaper(wallpaperId);
    if (!wallpaper) {
      return false;
    }

    // Dispose old wallpaper
    if (this.activeWallpaper) {
      this.activeWallpaper.dispose();
      this.activeWallpaper = null;
    }

    this.activeWallpaperId = wallpaperId;
    this.activeWallpaper = wallpaper;

    // Reset physics states
    this.interactionField.active = false;
    this.rippleField.clear();
    this.gravityManager.clear();
    this.parallaxManager.clear();

    const scene = this.sceneManager.getScene();
    const camera = this.cameraManager.getCamera();
    const quality = this.qualityManager.getConfig();

    this.activeWallpaper.init(scene, camera, quality);

    // Sync Diagnostics & Native Android Live Wallpaper Bridge
    DiagnosticManager.getInstance().updateEnvironment({
      activeWallpaperId: wallpaperId,
      qualityProfile: this.qualityManager.getProfile(),
      powerMode: this.powerEngine.getPowerMode(),
      isMotionAvailable: this.motionManager.getMotionData().isAvailable,
      isAudioAvailable: this.audioEngine.getConfig().enabled
    });
    AndroidWallpaperBridge.getInstance().setWallpaper(wallpaperId);

    return true;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.clock.start();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) {
      this.start();
    } else {
      this.isPaused = false;
      this.clock.getDelta(); // Clear accumulated delta
    }
  }

  public togglePause(): boolean {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
    return this.isPaused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public setQuality(profile: QualityProfile) {
    const config = this.qualityManager.setProfile(profile);
    this.renderer.applyQuality(config);

    const scene = this.sceneManager.getScene();
    this.lightingManager.configureQuality(config);
    this.effectManager.init(scene, config);

    if (this.activeWallpaper) {
      this.activeWallpaper.onQualityChange(config);
    }
    this.physicsEngine.onQualityChange(config);
    this.cinematicEngine.setQuality(config);
    this.audioEngine.setQuality(config);

    this.callbacks.onQualityChange?.(profile);
  }

  public getQuality(): QualityProfile {
    return this.qualityManager.getProfile();
  }

  public getCinematicEngine(): CinematicCameraEngine {
    return this.cinematicEngine;
  }

  public getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }

  public setMotionSensitivity(sensitivity: number) {
    this.motionManager.setSensitivity(sensitivity);
    this.parallaxManager.setSensitivity(sensitivity);
  }

  public getMotionManager(): MotionManager {
    return this.motionManager;
  }

  public getInteractionField(): InteractionField {
    return this.interactionField;
  }

  public getRippleField(): RippleField {
    return this.rippleField;
  }

  public getEnergyReaction(): EnergyReactionSystem {
    return this.energyReaction;
  }

  public getGravityManager(): GravityManager {
    return this.gravityManager;
  }

  public getParallaxManager(): ParallaxManager {
    return this.parallaxManager;
  }

  public getPhysicsEngine(): PhysicsEngine {
    return this.physicsEngine;
  }

  public async requestSensorPermission(): Promise<boolean> {
    return await this.motionManager.requestSensorPermission();
  }

  public calibrateMotionCenter() {
    this.motionManager.calibrateCenter();
  }

  public resetMotionCalibration() {
    this.motionManager.resetCalibration();
  }

  public updateMotionCalibration(settings: Partial<MotionCalibrationSettings>) {
    this.motionManager.updateCalibration(settings);
  }

  public getPowerEngine(): PowerOptimizationEngine {
    return this.powerEngine;
  }

  private loop = () => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    if (this.isPaused) return;

    const now = performance.now();
    if (!this.powerEngine.shouldRenderFrame(now)) {
      return;
    }

    const frameStart = this.performanceManager.beginFrame();
    const delta = Math.min(this.clock.getDelta(), 0.1); // Cap delta to prevent leaps
    const time = this.clock.getElapsedTime();

    // 1. Process Input & Gestures
    this.inputManager.updateDecay();
    const input = this.inputManager.getState();
    if (input.isDown || (input.gestureType && input.gestureType !== 'none')) {
      this.powerEngine.registerInteraction();
    }

    // Inject pointer fallback to motion system when device gyro is not active
    this.motionManager.injectPointerFallback(input.x, input.y);
    if (this.powerEngine.getSensorPowerManager().shouldUpdateSensors(now)) {
      this.motionManager.update(delta);
    }
    const motion = this.motionManager.getMotionData();
    if (motion.lastMotionEvent) {
      this.powerEngine.registerInteraction();
    }

    // 2. Gesture Integration with Physics Fields
    const wx = input.worldX || input.x * 12.0;
    const wy = input.worldY || input.y * 8.0;

    if (input.gestureType === 'tap') {
      this.energyReaction.triggerPulse(wx, wy, 0, 1.0);
      this.rippleField.spawnRipple(wx, wy, 1.2, 4.0, 8.0);
      this.interactionField.configure({
        mode: 'ripple',
        strength: 1.5,
        radius: 6.0,
        duration: 0.4
      });
      this.interactionField.setPosition(wx, wy, 0);
    } else if (input.gestureType === 'drag' && input.isDown) {
      this.interactionField.configure({
        mode: 'attraction',
        strength: 1.4,
        radius: 6.5,
        duration: 0
      });
      this.interactionField.setPosition(wx, wy, 0);
      this.rippleField.spawnRipple(wx, wy, 0.4, 3.0, 4.0);
    } else if (input.gestureType === 'longPress' && input.isDown) {
      // Strong gravitational well at touch point
      this.interactionField.configure({
        mode: 'vortex',
        strength: 2.8,
        radius: 8.5,
        duration: 0
      });
      this.interactionField.setPosition(wx, wy, 0);
      this.energyReaction.triggerPulse(wx, wy, 0, 0.8);
    } else if (input.gestureType === 'swipe' && input.swipeDirection) {
      this.interactionField.configure({
        mode: 'impulse',
        strength: 3.0,
        radius: 10.0,
        duration: 0.5
      });
      this.interactionField.setPosition(wx, wy, 0);
      this.interactionField.impulseVector.set(
        input.swipeDirection.x * input.swipeDirection.speed,
        input.swipeDirection.y * input.swipeDirection.speed,
        0
      );
      this.energyReaction.triggerPulse(wx, wy, 0, 1.2);
    } else if (!input.isDown && this.interactionField.duration === 0) {
      this.interactionField.active = false;
    }

    // 3. Update Physics Systems (throttled by EffectPowerManager if needed)
    this.interactionField.update(delta);
    this.rippleField.update(time);
    this.energyReaction.update(delta);
    if (this.powerEngine.getEffectPowerManager().shouldUpdatePhysics()) {
      this.physicsEngine.update(delta, time, input, motion);
    }

    // 4. Camera cinematic & Parallax update
    const camera = this.cameraManager.getCamera();
    this.cameraManager.update(motion, input, delta);
    this.parallaxManager.update(motion, input, camera);
    this.cinematicEngine.update(delta, time, motion, input);

    // 5. Effects & Audio Reactive update
    this.effectManager.update(time);
    let audioRes = {
      analysis: this.audioEngine.getAnalyzer().getCachedAnalysis(),
      targets: this.audioEngine.getReactiveEngine().getVisualTargets()
    };
    if (this.powerEngine.getConfig().effects.audioReactive) {
      audioRes = this.audioEngine.update(delta, this.activeWallpaperId);
      this.powerEngine.getEffectPowerManager().reportAudioEnergy(audioRes.analysis.energy);
    }

    // 6. Active Wallpaper update
    const scene = this.sceneManager.getScene();
    const quality = this.qualityManager.getConfig();
    const webglRenderer = this.renderer.getWebGLRenderer();

    if (this.activeWallpaper && webglRenderer) {
      const updateCtx: WallpaperUpdateContext = {
        time,
        delta,
        quality,
        input,
        motion,
        camera,
        scene,
        renderer: webglRenderer,
        interactionField: this.interactionField,
        rippleField: this.rippleField,
        energyReaction: this.energyReaction,
        gravityManager: this.gravityManager,
        parallaxManager: this.parallaxManager,
        physicsEngine: this.physicsEngine,
        cinematicEngine: this.cinematicEngine,
        audioEngine: this.audioEngine,
        audioAnalysis: audioRes.analysis,
        audioTargets: audioRes.targets
      };
      this.activeWallpaper.update(updateCtx);
    }

    // 7. Render frame (using PostProcessingEngine if active)
    const isPostProcActive = this.cinematicEngine.getState().postProcessing.enabled && this.powerEngine.getConfig().effects.postProcessing;
    if (isPostProcActive) {
      this.cinematicEngine.render(scene);
    } else {
      this.renderer.render(scene, camera);
    }

    // 8. Metrics & Stats
    if (webglRenderer) {
      const renderInfo = webglRenderer.info.render;
      const stats = this.performanceManager.endFrame(
        frameStart,
        renderInfo.calls,
        renderInfo.triangles,
        renderInfo.points,
        renderInfo.points
      );
      this.powerEngine.recordFrameTime(stats.frameTime);
      DiagnosticManager.getInstance().updateRenderStats(stats);
      this.callbacks.onStatsUpdate?.(stats);

      // Adaptive quality adjustment with hysteresis
      const adaptive = this.qualityManager.evaluatePerformance({
        fps: stats.fps,
        frameTime: stats.frameTime,
        particleCount: stats.particleCount,
        physicsEntities: 0,
        powerMode: this.powerEngine.getPowerMode()
      });
      if (adaptive.changed) {
        this.setQuality(this.qualityManager.getProfile());
      }
    }
  };

  private handleVisibilityChange() {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  }

  private handleResize() {
    if (!this.containerElement) return;
    const width = this.containerElement.clientWidth || window.innerWidth;
    const height = this.containerElement.clientHeight || window.innerHeight;
    this.handleResizeDimensions(width, height);
  }

  private handleResizeDimensions(width: number, height: number) {
    const quality = this.qualityManager.getConfig();
    this.cameraManager.resize(width, height);
    this.renderer.resize(width, height, quality);
    this.cinematicEngine.resize(width, height);
    if (this.activeWallpaper) {
      this.activeWallpaper.onResize(width, height);
    }
  }

  public getActiveWallpaperId(): string {
    return this.activeWallpaperId;
  }

  public getRegistry(): WallpaperRegistry {
    return this.registry;
  }

  public getGPUInfo() {
    return this.performanceManager.getGPUInfo();
  }

  public dispose() {
    this.stop();

    if (this.unsubscribeMotionEvent) {
      this.unsubscribeMotionEvent();
      this.unsubscribeMotionEvent = null;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundVisibilityChange);
      window.removeEventListener('resize', this.boundResize);
    }

    this.inputManager.detach();
    this.motionManager.dispose();
    this.energyReaction.dispose();
    this.parallaxManager.clear();
    this.gravityManager.clear();

    if (this.activeWallpaper) {
      this.activeWallpaper.dispose();
      this.activeWallpaper = null;
    }

    this.lightingManager.dispose();
    this.effectManager.dispose(this.sceneManager.getScene());
    this.audioEngine.dispose();
    this.sceneManager.dispose();
    this.renderer.dispose();
    this.containerElement = null;
  }
}
