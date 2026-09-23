import { QualityProfile, RenderStats, GPUInfo } from '../types/engine';
import { PowerMode } from '../power/types';

export type ErrorSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'FATAL';

export type ErrorCategory =
  | 'WEBGL'
  | 'RENDERING'
  | 'STORAGE'
  | 'DNA_VALIDATION'
  | 'HARDWARE_SENSOR'
  | 'AUDIO'
  | 'IMPORT_EXPORT'
  | 'SCHEDULER'
  | 'RUNTIME';

export interface SystemErrorEvent {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userFacingMessage: string;
  recoverable: boolean;
  technicalDetails?: string;
}

export interface MemoryDiagnostics {
  isAvailable: boolean;
  usedJSHeapSizeMB?: number;
  totalJSHeapSizeMB?: number;
  jsHeapSizeLimitMB?: number;
}

export interface DiagnosticsSnapshot {
  timestamp: number;
  appName: string;
  appVersion: string;
  owner: string;
  webglSupported: boolean;
  webglVersion: string;
  unmaskedRenderer: string;
  unmaskedVendor: string;
  maxTextureSize: number;
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  gpuTier: string;
  qualityProfile: QualityProfile;
  activeWallpaperId: string;
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  particleCount: number;
  powerMode: PowerMode;
  isDocumentVisible: boolean;
  isMotionSensorAvailable: boolean;
  isAudioReactiveAvailable: boolean;
  memory: MemoryDiagnostics;
  recentErrorsCount: number;
}
