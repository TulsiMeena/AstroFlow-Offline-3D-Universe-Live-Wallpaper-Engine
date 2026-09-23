import * as THREE from 'three';
import { MotionData } from '../types/engine';

export class WindSystem {
  private baseDirection: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
  private strength: number = 0.5;
  private angleDegrees: number = 45;
  private turbulence: number = 0.4;
  private gustTimer: number = 0;
  private gustMultiplier: number = 1.0;
  private motionGust: number = 0.0;
  private eventGust: number = 0.0;

  constructor(angleDegrees: number = 45, strength: number = 0.5, turbulence: number = 0.4) {
    this.setAngle(angleDegrees);
    this.strength = strength;
    this.turbulence = turbulence;
  }

  public setAngle(degrees: number): void {
    this.angleDegrees = degrees;
    const rad = (degrees * Math.PI) / 180;
    this.baseDirection.set(Math.cos(rad), 0, Math.sin(rad)).normalize();
  }

  public getAngle(): number {
    return this.angleDegrees;
  }

  public setStrength(strength: number): void {
    this.strength = Math.max(0, strength);
  }

  public getStrength(): number {
    return this.strength;
  }

  public setTurbulence(turbulence: number): void {
    this.turbulence = Math.max(0, turbulence);
  }

  public getTurbulence(): number {
    return this.turbulence;
  }

  public triggerEventGust(extraStrength: number, duration: number = 2.0): void {
    this.eventGust = Math.max(this.eventGust, extraStrength);
  }

  public update(delta: number, motion?: MotionData): void {
    this.gustTimer += delta;

    // Periodic natural gust oscillation (every 4-7 seconds)
    const naturalGust = Math.sin(this.gustTimer * 0.9) * Math.cos(this.gustTimer * 1.7);
    this.gustMultiplier = 1.0 + Math.max(0, naturalGust) * 1.2;

    // Motion influence: sudden acceleration adds wind impulse
    if (motion && motion.lastMotionEvent === 'SHAKE') {
      this.motionGust = Math.min(3.0, this.motionGust + delta * 5.0);
    } else {
      this.motionGust = Math.max(0, this.motionGust - delta * 2.0);
    }

    // Decay event gust
    if (this.eventGust > 0) {
      this.eventGust = Math.max(0, this.eventGust - delta * 1.5);
    }
  }

  public getWindAt(position: THREE.Vector3, time: number, outWind: THREE.Vector3): THREE.Vector3 {
    const totalStrength =
      this.strength * this.gustMultiplier + this.motionGust * 1.5 + this.eventGust * 2.0;

    outWind.copy(this.baseDirection).multiplyScalar(totalStrength);

    // Add 3D spatial turbulence
    if (this.turbulence > 0) {
      const turbX = Math.sin(position.y * 0.8 + time * 2.5) * this.turbulence * totalStrength * 0.4;
      const turbY = Math.cos(position.x * 0.8 + time * 2.0) * this.turbulence * totalStrength * 0.25;
      const turbZ = Math.sin(position.z * 0.8 + time * 2.2) * this.turbulence * totalStrength * 0.4;

      outWind.x += turbX;
      outWind.y += turbY;
      outWind.z += turbZ;
    }

    return outWind;
  }
}
