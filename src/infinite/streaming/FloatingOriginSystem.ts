import * as THREE from 'three';

export type OriginShiftListener = (shift: THREE.Vector3, totalOffset: THREE.Vector3) => void;

export class FloatingOriginSystem {
  private camera: THREE.Camera;
  private threshold: number;
  private accumulatedOffset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private listeners: OriginShiftListener[] = [];
  private tempShift: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.Camera, threshold: number = 350.0) {
    this.camera = camera;
    this.threshold = threshold;
  }

  public setThreshold(threshold: number): void {
    this.threshold = threshold;
  }

  public addListener(listener: OriginShiftListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Evaluates camera position and shifts origin if threshold is reached
   */
  public update(): boolean {
    const distSq = this.camera.position.x * this.camera.position.x + this.camera.position.z * this.camera.position.z;
    if (distSq < this.threshold * this.threshold) {
      return false;
    }

    // Origin shift needed!
    this.tempShift.set(this.camera.position.x, 0, this.camera.position.z);
    this.accumulatedOffset.add(this.tempShift);

    // Reset camera position horizontally
    this.camera.position.x = 0;
    this.camera.position.z = 0;

    // Notify listeners
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](this.tempShift, this.accumulatedOffset);
    }

    return true;
  }

  public getAccumulatedOffset(): THREE.Vector3 {
    return this.accumulatedOffset.clone();
  }

  public getWorldPosition(localPos: THREE.Vector3): THREE.Vector3 {
    return localPos.clone().add(this.accumulatedOffset);
  }

  public getLocalPosition(worldPos: THREE.Vector3): THREE.Vector3 {
    return worldPos.clone().sub(this.accumulatedOffset);
  }

  public reset(): void {
    this.accumulatedOffset.set(0, 0, 0);
  }
}
