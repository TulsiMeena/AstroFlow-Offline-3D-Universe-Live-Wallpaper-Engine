import {
  AndroidBridgeMessage,
  AndroidDeviceState,
  AndroidMessageType,
  AndroidMessageValidator,
  SetWallpaperPayload,
  SetQualityPayload,
  SetFPSPayload,
  SetBatteryModePayload,
  SetMotionPayload,
  SetAudioPayload
} from './types';
import { QualityProfile } from '../types/engine';
import { PowerMode } from '../power/types';
import { ErrorManager } from '../diagnostics/ErrorManager';

export type DeviceStateListener = (state: AndroidDeviceState) => void;
export type BridgeMessageListener = (msg: AndroidBridgeMessage) => void;

/**
 * AndroidWallpaperBridge
 * Future-ready native Android Live Wallpaper integration bridge.
 *
 * IMPORTANT: In accordance with browser security sandbox policies, a web
 * browser or PWA cannot directly set the Android OS home/lock screen live wallpaper.
 * This bridge provides a standardized, bidirectional IPC contract for when the
 * engine is hosted inside the native AmitHyperWallWallpaperService Android container.
 */
export class AndroidWallpaperBridge {
  private static instance: AndroidWallpaperBridge | null = null;
  private isNativeHostAvailable: boolean = false;
  private isWallpaperActive: boolean = false;
  private isPaused: boolean = false;

  private latestDeviceState: AndroidDeviceState | null = null;
  private stateListeners: DeviceStateListener[] = [];
  private messageListeners: BridgeMessageListener[] = [];

  public static getInstance(): AndroidWallpaperBridge {
    if (!AndroidWallpaperBridge.instance) {
      AndroidWallpaperBridge.instance = new AndroidWallpaperBridge();
    }
    return AndroidWallpaperBridge.instance;
  }

  private constructor() {
    this.detectNativeHost();
    this.setupWindowBridgeListener();
  }

  private detectNativeHost(): boolean {
    if (typeof window === 'undefined') {
      this.isNativeHostAvailable = false;
      return false;
    }
    // Check for Android WebView JavascriptInterface injected objects
    const win = window as any;
    this.isNativeHostAvailable = !!(
      win.AmitHyperWallAndroidBridge ||
      win.AndroidWallpaperBridge ||
      win.AndroidLiveWallpaperBridge
    );
    return this.isNativeHostAvailable;
  }

  private setupWindowBridgeListener() {
    if (typeof window === 'undefined') return;

    // Expose a secure entrypoint for native Android WebView to post messages into the web app
    (window as any).onNativeAndroidMessage = (rawJson: string | object) => {
      try {
        const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
        if (!AndroidMessageValidator.isValidMessage(parsed)) {
          console.warn('[AndroidWallpaperBridge] Rejected malformed message from native host:', parsed);
          return;
        }

        this.handleIncomingMessage(parsed);
      } catch (err) {
        console.error('[AndroidWallpaperBridge] Error parsing native message:', err);
      }
    };
  }

  private handleIncomingMessage(msg: AndroidBridgeMessage) {
    // Notify general message listeners
    for (const listener of this.messageListeners) {
      try {
        listener(msg);
      } catch (e) {
        console.error('Error in bridge message listener:', e);
      }
    }

    // Process specific native command types
    switch (msg.type) {
      case 'DEVICE_STATE':
        if (msg.payload) {
          this.receiveDeviceState(msg.payload as AndroidDeviceState);
        }
        break;
      case 'PAUSE':
        this.pauseWallpaper();
        break;
      case 'RESUME':
        this.resumeWallpaper();
        break;
      case 'SET_WALLPAPER':
        if (msg.payload?.wallpaperId) {
          const sanitizedId = AndroidMessageValidator.sanitizeString(msg.payload.wallpaperId, 64);
          this.setWallpaper(sanitizedId, msg.payload.configuration);
        }
        break;
      case 'SET_QUALITY':
        if (msg.payload?.quality) {
          this.setQuality(msg.payload.quality);
        }
        break;
      case 'SET_BATTERY_MODE':
        if (msg.payload?.mode) {
          this.setBatteryMode(msg.payload.mode);
        }
        break;
      default:
        break;
    }
  }

  private sendToNative(type: AndroidMessageType, payload?: any): boolean {
    const msg: AndroidBridgeMessage = {
      type,
      timestamp: Date.now(),
      payload
    };

    if (!this.isNativeHostAvailable) {
      return false;
    }

    try {
      const win = window as any;
      const nativeObj = win.AmitHyperWallAndroidBridge || win.AndroidWallpaperBridge;
      if (nativeObj && typeof nativeObj.postMessage === 'function') {
        nativeObj.postMessage(JSON.stringify(msg));
        return true;
      }
      return false;
    } catch (err: any) {
      ErrorManager.getInstance().reportError({
        category: 'RUNTIME',
        severity: 'WARNING',
        message: `Native Android bridge transmission failure: ${err?.message}`,
        userFacingMessage: 'Unable to communicate with native Android host.',
        recoverable: true
      });
      return false;
    }
  }

  /* ------------------- Core Interface Implementation ------------------- */

  public initialize(): boolean {
    this.detectNativeHost();
    this.sendToNative('INIT', {
      engine: 'Amit HyperWall',
      version: '1.5.0',
      owner: 'Amit Meena'
    });
    return true;
  }

  public startWallpaper(): void {
    this.isWallpaperActive = true;
    this.isPaused = false;
    this.sendToNative('RESUME');
  }

  public stopWallpaper(): void {
    this.isWallpaperActive = false;
    this.sendToNative('PAUSE');
  }

  public pauseWallpaper(): void {
    this.isPaused = true;
    this.sendToNative('PAUSE');
  }

  public resumeWallpaper(): void {
    this.isPaused = false;
    this.sendToNative('RESUME');
  }

  public setWallpaper(id: string, configuration?: Record<string, any>): void {
    const sanitizedId = AndroidMessageValidator.sanitizeString(id, 64);
    const payload: SetWallpaperPayload = {
      wallpaperId: sanitizedId,
      configuration: configuration || {}
    };
    this.sendToNative('SET_WALLPAPER', payload);
  }

  public setQuality(quality: QualityProfile): void {
    const payload: SetQualityPayload = { quality };
    this.sendToNative('SET_QUALITY', payload);
  }

  public setFPS(fps: number): void {
    const safeFps = Math.max(15, Math.min(120, Math.round(fps)));
    const payload: SetFPSPayload = { fps: safeFps };
    this.sendToNative('SET_FPS', payload);
  }

  public setBatteryMode(mode: PowerMode): void {
    const payload: SetBatteryModePayload = { mode };
    this.sendToNative('SET_BATTERY_MODE', payload);
  }

  public setMotionSensitivity(sensitivity: number): void {
    const safeSens = Math.max(0.1, Math.min(3.0, Number(sensitivity) || 1.0));
    const payload: SetMotionPayload = { enabled: true, sensitivity: safeSens };
    this.sendToNative('SET_MOTION', payload);
  }

  public setAudioReactiveMode(enabled: boolean): void {
    const payload: SetAudioPayload = { enabled: !!enabled };
    this.sendToNative('SET_AUDIO', payload);
  }

  public sendWallpaperConfiguration(config: Record<string, any>): void {
    this.sendToNative('SET_WALLPAPER', { configuration: config });
  }

  public receiveDeviceState(state: AndroidDeviceState): void {
    this.latestDeviceState = { ...state };
    for (const listener of this.stateListeners) {
      try {
        listener(this.latestDeviceState);
      } catch (err) {
        console.error('Error notifying device state listener:', err);
      }
    }
  }

  /* ------------------- Listeners & State Queries ------------------- */

  public isNativeHost(): boolean {
    return this.isNativeHostAvailable;
  }

  public getLatestDeviceState(): AndroidDeviceState | null {
    return this.latestDeviceState ? { ...this.latestDeviceState } : null;
  }

  public subscribeDeviceState(listener: DeviceStateListener): () => void {
    this.stateListeners.push(listener);
    if (this.latestDeviceState) {
      listener(this.latestDeviceState);
    }
    return () => {
      this.stateListeners = this.stateListeners.filter((l) => l !== listener);
    };
  }

  public subscribeMessages(listener: BridgeMessageListener): () => void {
    this.messageListeners.push(listener);
    return () => {
      this.messageListeners = this.messageListeners.filter((l) => l !== listener);
    };
  }
}
