export type QualityProfile = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';

export interface QualityConfig {
  profile: QualityProfile;
  resolutionScale: number;
  maxParticleCount: number;
  shadows: boolean;
  bloomEnabled: boolean;
  postProcessing: boolean;
  animationComplexity: number; // 0.5 to 1.5
  antialias: boolean;
}

export type GPUCapability = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GPUInfo {
  tier: GPUCapability;
  vendor: string;
  renderer: string;
  isWebGL2: boolean;
  webglSupported?: boolean;
  unmaskedRenderer?: string;
  unmaskedVendor?: string;
}

export interface RenderStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  points: number;
  particleCount: number;
}

export type MotionEventType =
  | 'SUBTLE_TILT'
  | 'FAST_TILT'
  | 'ROTATION'
  | 'SHAKE'
  | 'ACCELERATION_BURST';

export interface TouchPointerState {
  x: number; // -1 to 1 normalized coordinates
  y: number;
  deltaX: number;
  deltaY: number;
  isDown: boolean;
  pinchScale: number;
  worldX?: number; // 3D plane coordinates
  worldY?: number;
  gestureType?: 'none' | 'tap' | 'drag' | 'longPress' | 'swipe' | 'pinch';
  energyPulse?: number; // 0 to 1 decaying pulse
  longPressActive?: boolean;
  swipeDirection?: { x: number; y: number; speed: number };
  pointerCount?: number;
}

export interface MotionData {
  tiltX: number; // Radians or normalized -1 to 1
  tiltY: number;
  roll: number;
  isAvailable: boolean;
  pitch?: number; // Normalized -1 to 1
  yaw?: number;
  acceleration?: { x: number; y: number; z: number };
  rotationVelocity?: { alpha: number; beta: number; gamma: number };
  gyroscopeAvailable?: boolean;
  accelerometerAvailable?: boolean;
  lastMotionEvent?: MotionEventType | null;
}

export interface MotionCalibrationSettings {
  enabled: boolean;
  sensitivity: number;
  smoothing: number;
  deadzone: number;
  pitchOffset: number;
  rollOffset: number;
  yawOffset: number;
  reducedMotion: boolean;
  touchEnabled: boolean;
  invertX: boolean;
  invertY: boolean;
}

export interface EngineCallbacks {
  onStatsUpdate?: (stats: RenderStats) => void;
  onQualityChange?: (quality: QualityProfile) => void;
  onMotionEvent?: (event: MotionEventType) => void;
  onError?: (error: string) => void;
}
