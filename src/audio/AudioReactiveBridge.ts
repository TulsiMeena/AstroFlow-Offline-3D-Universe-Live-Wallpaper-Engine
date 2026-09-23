import { AudioAnalysisData, AudioReactiveConfig } from './types';

/**
 * AudioReactiveBridge
 * Native Android Live Wallpaper IPC Bridge interface.
 * When Amit HyperWall runs as a native Android Live Wallpaper service,
 * system audio sessions or Visualizer APIs can supply audio analysis frames
 * directly across this bridge.
 * 
 * Note: Browser Web Audio does not access Android system-wide live wallpaper audio;
 * this bridge provides the designated native decoupling layer.
 */
export interface INativeAudioSource {
  hasSystemAudioPermission(): boolean;
  startSystemAudioCapture(sampleRate: number, fftSize: number): boolean;
  stopSystemAudioCapture(): void;
  getLatestFrame(): Float32Array | null;
}

export class AudioReactiveBridge {
  private static instance: AudioReactiveBridge | null = null;
  private nativeSource: INativeAudioSource | null = null;
  private isNativeAvailable: boolean = false;

  public static getInstance(): AudioReactiveBridge {
    if (!AudioReactiveBridge.instance) {
      AudioReactiveBridge.instance = new AudioReactiveBridge();
    }
    return AudioReactiveBridge.instance;
  }

  constructor() {
    this.detectNativeBridge();
  }

  private detectNativeBridge(): void {
    if (typeof window !== 'undefined' && (window as any).AndroidAudioBridge) {
      this.isNativeAvailable = true;
      this.nativeSource = (window as any).AndroidAudioBridge;
    }
  }

  public isNativeCaptureSupported(): boolean {
    return this.isNativeAvailable;
  }

  public registerNativeSource(source: INativeAudioSource): void {
    this.nativeSource = source;
    this.isNativeAvailable = true;
  }

  public forwardAnalysisToNative(data: AudioAnalysisData, config: AudioReactiveConfig): void {
    if (this.isNativeAvailable && typeof (window as any).AndroidAudioBridge?.onWebAudioAnalysis === 'function') {
      try {
        (window as any).AndroidAudioBridge.onWebAudioAnalysis(JSON.stringify({
          volume: data.volume,
          bass: data.bass,
          mid: data.mid,
          treble: data.treble,
          isBeat: data.isBeat,
          bpm: data.bpm,
        }));
      } catch {}
    }
  }
}
