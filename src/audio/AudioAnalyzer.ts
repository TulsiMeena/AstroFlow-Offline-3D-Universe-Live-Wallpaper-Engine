import { AudioAnalysisData, AudioReactiveConfig } from './types';
import { FrequencyAnalyzer } from './FrequencyAnalyzer';
import { BeatDetector } from './BeatDetector';
import { RhythmDetector } from './RhythmDetector';
import { QualityConfig } from '../types/engine';

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private customSourceNode: AudioNode | null = null;

  private frequencyAnalyzer: FrequencyAnalyzer;
  private beatDetector: BeatDetector;
  private rhythmDetector: RhythmDetector;

  private frequencyBuffer: Uint8Array = new Uint8Array(256);
  private timeDomainBuffer: Uint8Array = new Uint8Array(256);

  private emptyAnalysis: AudioAnalysisData;
  private lastAnalysisTime: number = 0;
  private cachedAnalysis: AudioAnalysisData;

  constructor(quality?: QualityConfig) {
    this.frequencyAnalyzer = new FrequencyAnalyzer();
    this.beatDetector = new BeatDetector();
    this.rhythmDetector = new RhythmDetector();

    this.emptyAnalysis = {
      volume: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      energy: 0,
      isBeat: false,
      beatConfidence: 0,
      bpm: 120,
      rhythmIntensity: 0,
      bands: {
        subBass: 0,
        bass: 0,
        lowMid: 0,
        mid: 0,
        highMid: 0,
        presence: 0,
        treble: 0,
        brilliance: 0,
      },
      bandArray: [0, 0, 0, 0, 0, 0, 0, 0],
      rawFrequencies: new Uint8Array(0),
      timeDomain: new Uint8Array(0),
      timestamp: 0,
    };

    this.cachedAnalysis = { ...this.emptyAnalysis };
    this.applyQuality(quality);
  }

  public initContext(): AudioContext | null {
    if (!this.audioContext && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioContext = new AudioCtxClass();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }

  public connectStream(stream: MediaStream): boolean {
    const ctx = this.initContext();
    if (!ctx) return false;

    try {
      this.disconnectSource();

      if (!this.analyserNode) {
        this.analyserNode = ctx.createAnalyser();
        this.analyserNode.smoothingTimeConstant = 0.8;
        this.analyserNode.fftSize = this.getFftSizeForTier('HIGH');
      }

      this.sourceNode = ctx.createMediaStreamSource(stream);
      this.sourceNode.connect(this.analyserNode);

      const bufferLen = this.analyserNode.frequencyBinCount;
      this.frequencyBuffer = new Uint8Array(bufferLen);
      this.timeDomainBuffer = new Uint8Array(bufferLen);

      return true;
    } catch {
      return false;
    }
  }

  public connectNode(node: AudioNode): boolean {
    const ctx = this.initContext();
    if (!ctx) return false;

    try {
      if (!this.analyserNode) {
        this.analyserNode = ctx.createAnalyser();
        this.analyserNode.smoothingTimeConstant = 0.8;
        this.analyserNode.fftSize = 512;
      }

      this.customSourceNode = node;
      node.connect(this.analyserNode);

      const bufferLen = this.analyserNode.frequencyBinCount;
      this.frequencyBuffer = new Uint8Array(bufferLen);
      this.timeDomainBuffer = new Uint8Array(bufferLen);
      return true;
    } catch {
      return false;
    }
  }

  public disconnectSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }
    if (this.customSourceNode) {
      try {
        this.customSourceNode.disconnect();
      } catch {}
      this.customSourceNode = null;
    }
  }

  public applyQuality(quality?: QualityConfig): void {
    const tier = quality?.profile || 'HIGH';
    const fftSize = this.getFftSizeForTier(tier);

    if (this.analyserNode && this.analyserNode.fftSize !== fftSize) {
      this.analyserNode.fftSize = fftSize;
      const bufferLen = this.analyserNode.frequencyBinCount;
      this.frequencyBuffer = new Uint8Array(bufferLen);
      this.timeDomainBuffer = new Uint8Array(bufferLen);
    }
  }

  private getFftSizeForTier(tier: string): number {
    switch (tier) {
      case 'LOW':
        return 128;
      case 'MEDIUM':
        return 256;
      case 'HIGH':
        return 512;
      case 'ULTRA':
        return 1024;
      default:
        return 512;
    }
  }

  /**
   * Main analysis execution (called by AudioReactiveEngine)
   */
  public analyze(config: AudioReactiveConfig, delta: number): AudioAnalysisData {
    if (!this.analyserNode || !this.audioContext) {
      return this.emptyAnalysis;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
      return this.emptyAnalysis;
    }

    const now = performance.now() * 0.001;

    // Get time & frequency snapshots
    this.analyserNode.getByteFrequencyData(this.frequencyBuffer as any);
    this.analyserNode.getByteTimeDomainData(this.timeDomainBuffer as any);

    const sampleRate = this.audioContext.sampleRate || 44100;
    const freqRes = this.frequencyAnalyzer.analyze(
      this.frequencyBuffer,
      this.timeDomainBuffer,
      sampleRate,
      config.smoothingTimeConstant
    );

    // Apply sensitivity multiplier
    const sens = config.sensitivity;
    const vol = Math.min(1.0, freqRes.volume * sens);
    const bass = Math.min(1.0, freqRes.bass * sens * config.bassReaction);
    const mid = Math.min(1.0, freqRes.mid * sens * config.midReaction);
    const treble = Math.min(1.0, freqRes.treble * sens * config.trebleReaction);
    const energy = Math.min(1.0, freqRes.energy * sens);

    // Beat Detection
    const beatRes = this.beatDetector.detect(bass, now);

    // Rhythm Intensity
    const rhythm = this.rhythmDetector.update(energy, beatRes.isBeat, delta);

    this.cachedAnalysis = {
      volume: vol,
      bass,
      mid,
      treble,
      energy,
      isBeat: beatRes.isBeat,
      beatConfidence: beatRes.confidence * config.beatReaction,
      bpm: beatRes.bpm,
      rhythmIntensity: rhythm,
      bands: freqRes.bands,
      bandArray: freqRes.bandArray,
      rawFrequencies: this.frequencyBuffer,
      timeDomain: this.timeDomainBuffer,
      timestamp: now,
    };

    return this.cachedAnalysis;
  }

  public getCachedAnalysis(): AudioAnalysisData {
    return this.cachedAnalysis;
  }

  public reset(): void {
    this.frequencyAnalyzer.reset();
    this.beatDetector.reset();
    this.rhythmDetector.reset();
    this.cachedAnalysis = { ...this.emptyAnalysis };
  }

  public dispose(): void {
    this.disconnectSource();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {}
      this.audioContext = null;
    }
    this.analyserNode = null;
  }
}
