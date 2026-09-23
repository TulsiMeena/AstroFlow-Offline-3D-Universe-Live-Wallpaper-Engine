import { AudioPermissionState } from './types';

export class AudioPermissionManager {
  private static instance: AudioPermissionManager | null = null;
  private state: AudioPermissionState = 'prompt';
  private mediaStream: MediaStream | null = null;
  private listeners: ((state: AudioPermissionState) => void)[] = [];

  public static getInstance(): AudioPermissionManager {
    if (!AudioPermissionManager.instance) {
      AudioPermissionManager.instance = new AudioPermissionManager();
    }
    return AudioPermissionManager.instance;
  }

  constructor() {
    this.checkInitialSupport();
  }

  private checkInitialSupport(): void {
    if (typeof window === 'undefined') {
      this.state = 'unsupported';
      return;
    }
    const hasMediaDevices = !!(navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);

    if (!hasMediaDevices || !hasAudioContext) {
      this.state = 'unsupported';
    } else {
      this.state = 'prompt';
    }
  }

  public getState(): AudioPermissionState {
    return this.state;
  }

  public getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  public isAvailable(): boolean {
    return this.state === 'granted' && this.mediaStream !== null;
  }

  public subscribe(listener: (state: AudioPermissionState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (this.state === 'unsupported') {
      return false;
    }

    if (this.mediaStream && this.state === 'granted') {
      return true;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.mediaStream = stream;
      this.state = 'granted';
      this.notify();
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.state = 'denied';
      } else {
        this.state = 'unsupported';
      }
      this.mediaStream = null;
      this.notify();
      return false;
    }
  }

  public release(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.state === 'granted') {
      this.state = 'prompt';
      this.notify();
    }
  }
}
