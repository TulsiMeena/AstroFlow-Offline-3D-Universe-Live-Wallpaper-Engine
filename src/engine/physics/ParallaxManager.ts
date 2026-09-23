import * as THREE from 'three';
import { MotionData, TouchPointerState } from '../../types/engine';
import { lerp } from '../../utils/math';

export interface ParallaxLayerItem {
  object: THREE.Object3D;
  layer: number; // 0 to 5
  depthScale?: number;
  originalPos?: THREE.Vector3;
}

export class ParallaxManager {
  private layers: ParallaxLayerItem[] = [];
  private layerFactors: number[] = [
    0.03, // 0 = Distant background (nearly stationary)
    0.08, // 1 = Far stars
    0.20, // 2 = Mid nebula gas
    0.45, // 3 = Planets / solar bodies
    0.85, // 4 = Medium active particles
    1.40  // 5 = Foreground dynamic particles
  ];

  private sensitivity: number = 1.0;
  private currentDisplacement = new THREE.Vector2(0, 0);

  public register(object: THREE.Object3D, layer: number, depthScale: number = 1.0) {
    const clampedLayer = Math.max(0, Math.min(5, Math.floor(layer)));
    this.layers.push({
      object,
      layer: clampedLayer,
      depthScale,
      originalPos: object.position.clone()
    });
  }

  public unregister(object: THREE.Object3D) {
    this.layers = this.layers.filter(l => l.object !== object);
  }

  public clear() {
    this.layers = [];
  }

  public setSensitivity(val: number) {
    this.sensitivity = Math.max(0.1, Math.min(3.0, val));
  }

  public update(motion: MotionData, input: TouchPointerState, camera?: THREE.Camera) {
    // Determine effective parallax input
    let targetX = motion.tiltX;
    let targetY = motion.tiltY;

    // Add subtle touch pointer influence if available
    if (input.isDown) {
      targetX += input.x * 0.25;
      targetY += input.y * 0.25;
    }

    targetX *= this.sensitivity;
    targetY *= this.sensitivity;

    this.currentDisplacement.x = lerp(this.currentDisplacement.x, targetX, 0.08);
    this.currentDisplacement.y = lerp(this.currentDisplacement.y, targetY, 0.08);

    // Apply depth-based displacement to registered layer items
    for (let i = 0; i < this.layers.length; i++) {
      const item = this.layers[i];
      if (!item.object || !item.originalPos) continue;

      const factor = this.layerFactors[item.layer] * (item.depthScale || 1.0);
      const offsetX = this.currentDisplacement.x * factor * 5.0;
      const offsetY = this.currentDisplacement.y * factor * 5.0;

      item.object.position.x = item.originalPos.x + offsetX;
      item.object.position.y = item.originalPos.y + offsetY;
    }

    // Camera subtle rotation for depth realism
    if (camera) {
      const rotZ = -this.currentDisplacement.x * 0.04;
      camera.rotation.z = lerp(camera.rotation.z, rotZ, 0.06);
    }
  }

  public getLayerFactor(layer: number): number {
    const clamped = Math.max(0, Math.min(5, Math.floor(layer)));
    return this.layerFactors[clamped];
  }
}
