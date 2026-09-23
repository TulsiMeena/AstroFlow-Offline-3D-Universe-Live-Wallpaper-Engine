import {
  AudioAnalysisData,
  AudioReactiveConfig,
  AudioReactiveVisualTargets,
  AudioPresetType,
  GenerativeSoundCategory,
} from './types';
import { AudioPermissionManager } from './AudioPermissionManager';
import { AudioAnalyzer } from './AudioAnalyzer';
import { GenerativeSoundEngine } from './GenerativeSoundEngine';
import { AudioPresetManager } from './AudioPresetManager';
import { AudioReactiveEngine } from './AudioReactiveEngine';
import { QualityConfig } from '../types/engine';

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private permissionManager: AudioPermissionManager;
  private analyzer: AudioAnalyzer;
  private soundEngine: GenerativeSoundEngine;
  private presetManager: AudioPresetManager;
  private reactiveEngine: AudioReactiveEngine;

  private config: AudioReactiveConfig;
  private subscribers: ((config: AudioReactiveConfig) => void)[] = [];

  public static getInstance(quality?: QualityConfig): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine(quality);
    }
    return AudioEngine.instance;
  }

  constructor(quality?: QualityConfig) {
    this.permissionManager = AudioPermissionManager.getInstance();
    this.analyzer = new AudioAnalyzer(quality);
    this.soundEngine = new GenerativeSoundEngine(this.analyzer.getAudioContext());
    this.presetManager = new AudioPresetManager();
    this.reactiveEngine = new AudioReactiveEngine(this.analyzer, this.soundEngine, quality);

    this.config = {
      enabled: true,
      localAudioEnabled: false,
      generativeSoundEnabled: false,
      sensitivity: 1.0,
      bassReaction: 1.0,
      midReaction: 1.0,
      trebleReaction: 1.0,
      beatReaction: 1.0,
      visualIntensity: 1.0,
      cameraReaction: 0.3,
      physicsReaction: 1.0,
      preset: 'balanced',
      soundCategory: 'space',
      soundVolume: 0.6,
      smoothingTimeConstant: 0.82,
    };

    AudioEngine.instance = this;
  }

  public getConfig(): AudioReactiveConfig {
    return { ...this.config };
  }

  public getPermissionManager(): AudioPermissionManager {
    return this.permissionManager;
  }

  public getSoundEngine(): GenerativeSoundEngine {
    return this.soundEngine;
  }

  public getAnalyzer(): AudioAnalyzer {
    return this.analyzer;
  }

  public getReactiveEngine(): AudioReactiveEngine {
    return this.reactiveEngine;
  }

  public subscribe(fn: (config: AudioReactiveConfig) => void): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  private notify(): void {
    for (const sub of this.subscribers) {
      sub({ ...this.config });
    }
  }

  public updateConfig(partial: Partial<AudioReactiveConfig>): void {
    this.config = { ...this.config, ...partial };
    if (partial.soundVolume !== undefined) {
      this.soundEngine.setVolume(this.config.soundVolume);
    }
    this.notify();
  }

  public setPreset(presetId: AudioPresetType): void {
    const preset = this.presetManager.getPreset(presetId);
    this.config = {
      ...this.config,
      ...preset.config,
      preset: presetId,
    };
    this.notify();
  }

  public async startLocalAudio(): Promise<boolean> {
    const granted = await this.permissionManager.requestPermission();
    if (!granted) {
      this.config.localAudioEnabled = false;
      this.notify();
      return false;
    }

    const stream = this.permissionManager.getMediaStream();
    if (stream) {
      this.analyzer.connectStream(stream);
      this.config.localAudioEnabled = true;
      this.notify();
      return true;
    }
    return false;
  }

  public stopLocalAudio(): void {
    this.analyzer.disconnectSource();
    this.permissionManager.release();
    this.config.localAudioEnabled = false;
    this.notify();
  }

  public async toggleLocalAudio(): Promise<boolean> {
    if (this.config.localAudioEnabled) {
      this.stopLocalAudio();
      return false;
    } else {
      return await this.startLocalAudio();
    }
  }

  public startGenerativeSound(category?: GenerativeSoundCategory): void {
    if (category) {
      this.config.soundCategory = category;
    }
    const ctx = this.analyzer.initContext();
    if (ctx) {
      this.soundEngine.initNodes(ctx);
    }
    this.soundEngine.start(this.config.soundCategory);
    this.soundEngine.setVolume(this.config.soundVolume);

    // If local mic is not running, connect the generative sound output to the analyzer
    // so the wallpaper visuals can react to the generative ambient sound!
    if (!this.config.localAudioEnabled) {
      const soundNode = this.soundEngine.getOutputNode();
      if (soundNode) {
        this.analyzer.connectNode(soundNode);
      }
    }

    this.config.generativeSoundEnabled = true;
    this.notify();
  }

  public stopGenerativeSound(): void {
    this.soundEngine.stop();
    this.config.generativeSoundEnabled = false;
    if (!this.config.localAudioEnabled) {
      this.analyzer.disconnectSource();
    }
    this.notify();
  }

  public toggleGenerativeSound(): void {
    if (this.config.generativeSoundEnabled) {
      this.stopGenerativeSound();
    } else {
      this.startGenerativeSound();
    }
  }

  public setSoundCategory(category: GenerativeSoundCategory): void {
    this.config.soundCategory = category;
    if (this.config.generativeSoundEnabled) {
      this.soundEngine.setCategory(category);
    }
    this.notify();
  }

  public setQuality(quality: QualityConfig): void {
    this.reactiveEngine.setQuality(quality);
  }

  /**
   * Main audio loop step called by WallpaperEngine
   */
  public update(
    delta: number,
    activeWallpaperId?: string
  ): {
    analysis: AudioAnalysisData;
    targets: AudioReactiveVisualTargets;
  } {
    return this.reactiveEngine.update(delta, this.config, activeWallpaperId);
  }

  public dispose(): void {
    this.stopLocalAudio();
    this.stopGenerativeSound();
    this.analyzer.dispose();
  }
}
