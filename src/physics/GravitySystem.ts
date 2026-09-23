import * as THREE from 'three';
import { GravityPresetType } from './types';
import { MotionData } from '../types/engine';

export class GravitySystem {
  private mode: GravityPresetType = 'normal';
  private strength: number = 1.0;
  private center: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private tiltGravity: THREE.Vector3 = new THREE.Vector3(0, -9.81, 0);
  private smoothedTilt: THREE.Vector3 = new THREE.Vector3(0, -1, 0);
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private tangentVec: THREE.Vector3 = new THREE.Vector3();
  private upAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  constructor(mode: GravityPresetType = 'normal', strength: number = 1.0) {
    this.mode = mode;
    this.strength = strength;
  }

  public setMode(mode: GravityPresetType): void {
    this.mode = mode;
  }

  public getMode(): GravityPresetType {
    return this.mode;
  }

  public setStrength(strength: number): void {
    this.strength = Math.max(0, strength);
  }

  public getStrength(): number {
    return this.strength;
  }

  public setCenter(center: THREE.Vector3): void {
    this.center.copy(center);
  }

  /**
   * Update gravity with motion sensor fusion tilt
   */
  public updateMotion(motion: MotionData, delta: number): void {
    const roll = motion.roll ?? motion.tiltX ?? 0;
    const pitch = motion.pitch ?? motion.tiltY ?? 0;
    const targetX = roll * 0.8;
    const targetY = -1.0 + Math.abs(pitch) * 0.3;
    const targetZ = pitch * 0.8;

    const lerpFactor = Math.min(1.0, delta * 4.0);
    this.smoothedTilt.x += (targetX - this.smoothedTilt.x) * lerpFactor;
    this.smoothedTilt.y += (targetY - this.smoothedTilt.y) * lerpFactor;
    this.smoothedTilt.z += (targetZ - this.smoothedTilt.z) * lerpFactor;
    this.smoothedTilt.normalize();
  }

  /**
   * Get gravity force vector at a specific 3D point
   */
  public getGravityAt(position: THREE.Vector3, outForce: THREE.Vector3): THREE.Vector3 {
    outForce.set(0, 0, 0);
    const g = 9.81 * this.strength;

    switch (this.mode) {
      case 'normal': {
        // Oriented by device tilt
        outForce.copy(this.smoothedTilt).multiplyScalar(g);
        break;
      }

      case 'low': {
        outForce.copy(this.smoothedTilt).multiplyScalar(g * 0.25);
        break;
      }

      case 'zero': {
        outForce.set(0, 0, 0);
        break;
      }

      case 'reverse': {
        outForce.copy(this.smoothedTilt).multiplyScalar(-g);
        break;
      }

      case 'planet': {
        // Spherical pull towards planet center
        this.tempVec.subVectors(this.center, position);
        const dist = Math.max(0.2, this.tempVec.length());
        this.tempVec.normalize().multiplyScalar(g * 1.5);
        outForce.copy(this.tempVec);
        break;
      }

      case 'black-hole': {
        // Strong inward pull + exponential intensification near event horizon
        this.tempVec.subVectors(this.center, position);
        const dist = Math.max(0.1, this.tempVec.length());
        const pull = (g * 8.0) / (dist * dist * 0.2 + 1.0);
        this.tempVec.normalize().multiplyScalar(pull);
        
        // Swirl tangential component
        this.tangentVec.crossVectors(this.tempVec, this.upAxis).normalize().multiplyScalar(pull * 0.5);
        outForce.copy(this.tempVec).add(this.tangentVec);
        break;
      }

      case 'vortex': {
        // Downward + rotational swirl
        outForce.set(0, -g * 0.6, 0);
        this.tempVec.subVectors(this.center, position);
        this.tempVec.y = 0; // horizontal distance
        const dist = Math.max(0.2, this.tempVec.length());
        this.tangentVec.crossVectors(this.tempVec, this.upAxis).normalize().multiplyScalar(g * 0.8);
        this.tempVec.normalize().multiplyScalar(g * 0.5);
        outForce.add(this.tangentVec).add(this.tempVec);
        break;
      }
    }

    return outForce;
  }
}
