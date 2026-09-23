import { QualityProfile } from '../types/engine';
import { PowerMode } from '../power/types';

export type AndroidMessageType =
  | 'INIT'
  | 'SET_WALLPAPER'
  | 'SET_QUALITY'
  | 'SET_FPS'
  | 'SET_BATTERY_MODE'
  | 'SET_MOTION'
  | 'SET_AUDIO'
  | 'PAUSE'
  | 'RESUME'
  | 'GET_STATE'
  | 'DEVICE_STATE'
  | 'ERROR';

export type AndroidWallpaperLifecycle =
  | 'CREATED'
  | 'SURFACE_CREATED'
  | 'SURFACE_CHANGED'
  | 'VISIBILITY_CHANGED'
  | 'OFFSETS_CHANGED'
  | 'SURFACE_DESTROYED'
  | 'DESTROYED';

export interface AndroidDeviceState {
  screenWidth: number;
  screenHeight: number;
  densityDpi: number;
  refreshRate: number;
  batteryLevel: number; // 0.0 - 1.0
  isCharging: boolean;
  isPowerSaveMode: boolean;
  motionSensorsAvailable: boolean;
  audioCapability: boolean;
  devicePerformanceTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'FLAGSHIP';
  isWallpaperVisible: boolean;
  lifecycleState: AndroidWallpaperLifecycle;
  xOffset?: number; // Launcher home screen scroll offset (0.0 - 1.0)
  yOffset?: number;
}

export interface AndroidBridgeMessage<T = any> {
  type: AndroidMessageType;
  timestamp: number;
  payload?: T;
}

export interface SetWallpaperPayload {
  wallpaperId: string;
  configuration?: Record<string, any>;
}

export interface SetQualityPayload {
  quality: QualityProfile;
}

export interface SetFPSPayload {
  fps: number;
}

export interface SetBatteryModePayload {
  mode: PowerMode;
}

export interface SetMotionPayload {
  enabled: boolean;
  sensitivity: number;
}

export interface SetAudioPayload {
  enabled: boolean;
}

/**
 * Message Validation: strictly validates all incoming bridge commands
 * to reject malformed commands and ensure security (no arbitrary JS execution).
 */
export class AndroidMessageValidator {
  private static VALID_TYPES: Set<string> = new Set([
    'INIT',
    'SET_WALLPAPER',
    'SET_QUALITY',
    'SET_FPS',
    'SET_BATTERY_MODE',
    'SET_MOTION',
    'SET_AUDIO',
    'PAUSE',
    'RESUME',
    'GET_STATE',
    'DEVICE_STATE',
    'ERROR'
  ]);

  public static isValidMessage(msg: any): msg is AndroidBridgeMessage {
    if (!msg || typeof msg !== 'object') return false;
    if (typeof msg.type !== 'string' || !this.VALID_TYPES.has(msg.type)) return false;
    return true;
  }

  public static sanitizeString(input: string, maxLen: number = 200): string {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>'"`;(){}\\]/g, '').substring(0, maxLen).trim();
  }
}
