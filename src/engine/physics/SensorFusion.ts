import { MotionData, MotionEventType, MotionCalibrationSettings } from '../../types/engine';
import { lerp } from '../../utils/math';

export class SensorFusion {
  private motionData: MotionData = {
    tiltX: 0,
    tiltY: 0,
    roll: 0,
    pitch: 0,
    yaw: 0,
    acceleration: { x: 0, y: 0, z: 0 },
    rotationVelocity: { alpha: 0, beta: 0, gamma: 0 },
    isAvailable: false,
    gyroscopeAvailable: false,
    accelerometerAvailable: false,
    lastMotionEvent: null
  };

  private targetTiltX: number = 0;
  private targetTiltY: number = 0;
  private targetRoll: number = 0;
  private targetYaw: number = 0;

  // Calibration and configuration
  private settings: MotionCalibrationSettings = {
    enabled: true,
    sensitivity: 1.0,
    smoothing: 0.1,
    deadzone: 0.02,
    pitchOffset: 0,
    rollOffset: 0,
    yawOffset: 0,
    reducedMotion: false,
    touchEnabled: true,
    invertX: false,
    invertY: false
  };

  // Event detection & cooldowns
  private lastEventTime: number = 0;
  private lastAccel = { x: 0, y: 0, z: 0 };
  private listeners: ((event: MotionEventType) => void)[] = [];
  private eventCooldowns: Record<MotionEventType, number> = {
    SHAKE: 0,
    ACCELERATION_BURST: 0,
    FAST_TILT: 0,
    ROTATION: 0,
    SUBTLE_TILT: 0
  };

  // Event handlers
  private boundOrientation = this.handleOrientation.bind(this);
  private boundMotion = this.handleMotion.bind(this);
  private isListening: boolean = false;
  private permissionGranted: boolean | null = null;

  constructor() {
    this.loadSettings();
    this.initSensors();
  }

  public loadSettings() {
    try {
      const stored = localStorage.getItem('amit_hyperwall_motion_calibration');
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback to defaults if localStorage unavailable
    }
  }

  public saveSettings() {
    try {
      localStorage.setItem('amit_hyperwall_motion_calibration', JSON.stringify(this.settings));
    } catch {
      // Ignored
    }
  }

  public updateSettings(partial: Partial<MotionCalibrationSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  public getSettings(): MotionCalibrationSettings {
    return { ...this.settings };
  }

  public calibrateCenter() {
    this.settings.pitchOffset = this.targetTiltY;
    this.settings.rollOffset = this.targetTiltX;
    this.settings.yawOffset = this.targetYaw;
    this.saveSettings();
  }

  public resetCalibration() {
    this.settings.pitchOffset = 0;
    this.settings.rollOffset = 0;
    this.settings.yawOffset = 0;
    this.saveSettings();
  }

  public async requestSensorPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // iOS 13+ requires explicit user interaction to request DeviceOrientation permission
    const DeviceOrientation = window.DeviceOrientationEvent as any;
    if (DeviceOrientation && typeof DeviceOrientation.requestPermission === 'function') {
      try {
        const response = await DeviceOrientation.requestPermission();
        this.permissionGranted = response === 'granted';
        if (this.permissionGranted) {
          this.initSensors();
        }
        return this.permissionGranted;
      } catch (err) {
        console.warn('DeviceOrientation permission error:', err);
        this.permissionGranted = false;
        return false;
      }
    }

    this.permissionGranted = true;
    return true;
  }

  private initSensors() {
    if (typeof window === 'undefined' || this.isListening) return;

    if ('DeviceOrientationEvent' in window) {
      try {
        window.addEventListener('deviceorientation', this.boundOrientation, { passive: true });
        this.isListening = true;
      } catch (e) {
        console.warn('DeviceOrientation listener failed:', e);
      }
    }

    if ('DeviceMotionEvent' in window) {
      try {
        window.addEventListener('devicemotion', this.boundMotion, { passive: true });
      } catch (e) {
        console.warn('DeviceMotion listener failed:', e);
      }
    }
  }

  private handleOrientation(e: DeviceOrientationEvent) {
    if (!this.settings.enabled) return;
    if (e.beta === null || e.gamma === null) return;

    this.motionData.isAvailable = true;
    this.motionData.gyroscopeAvailable = true;

    // Beta = pitch [-180, 180], gamma = roll [-90, 90], alpha = yaw [0, 360]
    // 45 degrees is standard hand-held phone angle
    let rawPitch = (e.beta - 45) / 45;
    let rawRoll = e.gamma / 45;
    let rawYaw = (e.alpha || 0) * (Math.PI / 180);

    // Apply calibration offsets
    rawPitch -= this.settings.pitchOffset;
    rawRoll -= this.settings.rollOffset;
    rawYaw -= this.settings.yawOffset;

    // Invert axes if configured
    if (this.settings.invertX) rawRoll = -rawRoll;
    if (this.settings.invertY) rawPitch = -rawPitch;

    // Apply dead-zone to prevent sensor tremor on stationary desk
    const dz = this.settings.deadzone;
    if (Math.abs(rawPitch) < dz) rawPitch = 0;
    if (Math.abs(rawRoll) < dz) rawRoll = 0;

    // Reduced motion mode scales down intensity
    const intensityMultiplier = this.settings.reducedMotion ? 0.2 : 1.0;
    const sens = this.settings.sensitivity * intensityMultiplier;

    // Clamp limits [-1, 1]
    this.targetTiltY = Math.max(-1, Math.min(1, rawPitch * sens));
    this.targetTiltX = Math.max(-1, Math.min(1, rawRoll * sens));
    this.targetRoll = rawRoll * sens;
    this.targetYaw = rawYaw;

    // Detect fast tilt gesture
    const deltaTilt = Math.abs(this.targetTiltX - this.motionData.tiltX) + Math.abs(this.targetTiltY - this.motionData.tiltY);
    if (deltaTilt > 0.45) {
      this.triggerEvent('FAST_TILT', 400);
    } else if (deltaTilt > 0.1) {
      this.triggerEvent('SUBTLE_TILT', 300);
    }
  }

  private handleMotion(e: DeviceMotionEvent) {
    if (!this.settings.enabled) return;

    const accel = e.acceleration || e.accelerationIncludingGravity;
    if (accel && (accel.x !== null || accel.y !== null || accel.z !== null)) {
      this.motionData.accelerometerAvailable = true;
      const ax = accel.x || 0;
      const ay = accel.y || 0;
      const az = accel.z || 0;

      this.motionData.acceleration = { x: ax, y: ay, z: az };

      // Shake detection: sudden high delta in acceleration (> 14 m/s²)
      const deltaA = Math.sqrt(
        Math.pow(ax - this.lastAccel.x, 2) +
        Math.pow(ay - this.lastAccel.y, 2) +
        Math.pow(az - this.lastAccel.z, 2)
      );

      if (deltaA > 15) {
        this.triggerEvent('SHAKE', 600);
      } else if (deltaA > 8.5) {
        this.triggerEvent('ACCELERATION_BURST', 400);
      }

      this.lastAccel = { x: ax, y: ay, z: az };
    }

    if (e.rotationRate) {
      this.motionData.rotationVelocity = {
        alpha: e.rotationRate.alpha || 0,
        beta: e.rotationRate.beta || 0,
        gamma: e.rotationRate.gamma || 0
      };

      const rotMag = Math.abs(e.rotationRate.alpha || 0) + Math.abs(e.rotationRate.beta || 0);
      if (rotMag > 60) {
        this.triggerEvent('ROTATION', 400);
      }
    }
  }

  public subscribe(fn: (event: MotionEventType) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private triggerEvent(type: MotionEventType, cooldownMs: number) {
    const now = performance.now();
    if (now - (this.eventCooldowns[type] || 0) < cooldownMs) return;

    this.eventCooldowns[type] = now;
    this.motionData.lastMotionEvent = type;

    for (const listener of this.listeners) {
      try {
        listener(type);
      } catch (err) {
        console.error('Error in motion event listener:', err);
      }
    }
  }

  /**
   * Fallback for desktop / pointer: when device sensors are not present,
   * pointer movement smoothly simulates device tilt for 3D parallax!
   */
  public injectPointerFallback(normX: number, normY: number) {
    if (this.motionData.isAvailable) return; // Real hardware sensor takes precedence

    const sens = this.settings.sensitivity * (this.settings.reducedMotion ? 0.2 : 0.85);
    this.targetTiltX = normX * sens;
    this.targetTiltY = normY * sens;
    this.targetRoll = normX * sens * 0.5;
  }

  public update(delta: number = 0.016) {
    if (!this.settings.enabled) {
      this.motionData.tiltX = lerp(this.motionData.tiltX, 0, 0.1);
      this.motionData.tiltY = lerp(this.motionData.tiltY, 0, 0.1);
      this.motionData.roll = lerp(this.motionData.roll, 0, 0.1);
      return;
    }

    // Dynamic smoothing factor: higher smoothing setting = slower, more cinematic lag
    const smoothRate = Math.max(0.02, Math.min(0.25, this.settings.smoothing));

    this.motionData.tiltX = lerp(this.motionData.tiltX, this.targetTiltX, smoothRate);
    this.motionData.tiltY = lerp(this.motionData.tiltY, this.targetTiltY, smoothRate);
    this.motionData.roll = lerp(this.motionData.roll, this.targetRoll, smoothRate);
    this.motionData.pitch = this.motionData.tiltY;
    this.motionData.yaw = lerp(this.motionData.yaw || 0, this.targetYaw, smoothRate);
  }

  public getMotionData(): MotionData {
    return { ...this.motionData };
  }

  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('deviceorientation', this.boundOrientation);
      window.removeEventListener('devicemotion', this.boundMotion);
    }
    this.isListening = false;
    this.listeners = [];
  }
}
