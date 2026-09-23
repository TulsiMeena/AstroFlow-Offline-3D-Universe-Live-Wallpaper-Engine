import * as THREE from 'three';
import { AccessibilitySettings, CameraEventType } from './types';

export class CameraShakeSystem {
  private trauma: number = 0; // 0.0 to 1.0
  private traumaDecayRate: number = 1.6; // Units per second
  private shakeFrequency: number = 24.0; // Oscillations per second
  private shakeTime: number = 0;

  // Maximum shake amplitude
  private maxPosOffset = new THREE.Vector3(0.35, 0.35, 0.25);
  private maxRotOffset = new THREE.Vector3(0.06, 0.06, 0.08); // Radians

  // Current calculated offsets
  public currentPositionOffset = new THREE.Vector3();
  public currentRotationOffset = new THREE.Vector3();

  // Directional impulse kick (e.g. from shockwave or meteor)
  private impulseOffset = new THREE.Vector3();

  constructor() {}

  /**
   * Add camera trauma (clamped 0 to 1)
   */
  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  /**
   * Set trauma directly
   */
  public setTrauma(amount: number): void {
    this.trauma = Math.min(1.0, Math.max(0, amount));
  }

  /**
   * Trigger cinematic event shake with appropriate trauma & impulse
   */
  public handleEvent(event: CameraEventType, intensity: number = 1.0): void {
    switch (event) {
      case 'meteor-impact':
        this.addTrauma(0.75 * intensity);
        this.impulseOffset.set(0, -0.2 * intensity, -0.15 * intensity);
        break;
      case 'volcano-eruption':
        this.addTrauma(0.85 * intensity);
        this.impulseOffset.set(0, 0.25 * intensity, 0.1 * intensity);
        break;
      case 'energy-explosion':
      case 'shockwave':
        this.addTrauma(0.65 * intensity);
        this.impulseOffset.set(0, 0, 0.3 * intensity);
        break;
      case 'lightning':
        this.addTrauma(0.4 * intensity);
        break;
      case 'black-hole':
        // Continuous subtle low-frequency wobble
        this.addTrauma(0.25 * intensity);
        break;
      case 'supernova':
        this.addTrauma(0.9 * intensity);
        break;
      case 'portal-opening':
        this.addTrauma(0.35 * intensity);
        break;
      case 'aurora-burst':
        this.addTrauma(0.15 * intensity);
        break;
      case 'ocean-wave':
        this.addTrauma(0.3 * intensity);
        this.impulseOffset.set(0, 0.15 * intensity, 0);
        break;
    }
  }

  /**
   * Update shake state and compute 6-DOF offsets
   */
  public update(
    delta: number,
    shakeStrength: number,
    accessibility: AccessibilitySettings
  ): void {
    if (
      accessibility.disableCameraShake ||
      accessibility.reducedMotion ||
      shakeStrength <= 0.001
    ) {
      this.trauma = 0;
      this.currentPositionOffset.set(0, 0, 0);
      this.currentRotationOffset.set(0, 0, 0);
      this.impulseOffset.set(0, 0, 0);
      return;
    }

    if (this.trauma > 0) {
      this.shakeTime += delta * this.shakeFrequency;
      // Natural quadratic trauma falloff (trauma^2)
      const shakePower = Math.pow(this.trauma, 2) * shakeStrength;

      // Harmonic multi-frequency noise approximation
      const t1 = this.shakeTime;
      const t2 = this.shakeTime * 1.37 + 1.2;
      const t3 = this.shakeTime * 0.79 + 3.4;

      const pX = (Math.sin(t1) + Math.sin(t1 * 2.3) * 0.5) * this.maxPosOffset.x * shakePower;
      const pY = (Math.cos(t2) + Math.cos(t2 * 1.8) * 0.5) * this.maxPosOffset.y * shakePower;
      const pZ = (Math.sin(t3) + Math.cos(t3 * 2.1) * 0.5) * this.maxPosOffset.z * shakePower;

      const rX = (Math.sin(t2 * 1.1) + Math.cos(t1 * 1.5) * 0.4) * this.maxRotOffset.x * shakePower;
      const rY = (Math.cos(t1 * 1.2) + Math.sin(t3 * 1.4) * 0.4) * this.maxRotOffset.y * shakePower;
      const rZ = (Math.sin(t3 * 1.3) + Math.cos(t2 * 1.6) * 0.4) * this.maxRotOffset.z * shakePower;

      this.currentPositionOffset.set(
        pX + this.impulseOffset.x,
        pY + this.impulseOffset.y,
        pZ + this.impulseOffset.z
      );
      this.currentRotationOffset.set(rX, rY, rZ);

      // Decay trauma and directional impulse smoothly
      this.trauma = Math.max(0, this.trauma - delta * this.traumaDecayRate);
      const impulseDecay = Math.min(1.0, delta * 6.0);
      this.impulseOffset.lerp(new THREE.Vector3(0, 0, 0), impulseDecay);
    } else {
      this.currentPositionOffset.set(0, 0, 0);
      this.currentRotationOffset.set(0, 0, 0);
      this.impulseOffset.set(0, 0, 0);
    }
  }

  public getTrauma(): number {
    return this.trauma;
  }
}
