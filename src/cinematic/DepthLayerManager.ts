import * as THREE from 'three';
import { DepthLayer, AccessibilitySettings } from './types';
import { MotionData, TouchPointerState } from '../types/engine';

export class DepthLayerManager {
  private layers: Map<string, DepthLayer> = new Map();
  private rootGroup: THREE.Group;

  // Smoothed parallax displacement coordinates
  private smoothedOffset = new THREE.Vector2();

  constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'DepthLayerManager_Root';

    this.createLayer('foreground', 1.8, 2.0);
    this.createLayer('midground', 1.0, 0.0);
    this.createLayer('background', 0.45, -4.0);
    this.createLayer('far-background', 0.15, -12.0);
  }

  public getRootGroup(): THREE.Group {
    return this.rootGroup;
  }

  private createLayer(
    id: 'foreground' | 'midground' | 'background' | 'far-background',
    parallaxMultiplier: number,
    depthOffset: number
  ): void {
    const group = new THREE.Group();
    group.name = `DepthLayer_${id}`;
    group.position.z = depthOffset;
    this.rootGroup.add(group);

    this.layers.set(id, {
      id,
      group,
      parallaxMultiplier,
      depthOffset
    });
  }

  public getLayer(id: 'foreground' | 'midground' | 'background' | 'far-background'): THREE.Group | undefined {
    return this.layers.get(id)?.group;
  }

  public addToLayer(
    id: 'foreground' | 'midground' | 'background' | 'far-background',
    object: THREE.Object3D
  ): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.group.add(object);
    }
  }

  public removeFromLayer(
    id: 'foreground' | 'midground' | 'background' | 'far-background',
    object: THREE.Object3D
  ): void {
    const layer = this.layers.get(id);
    if (layer) {
      layer.group.remove(object);
    }
  }

  /**
   * Update layer parallax shifts based on sensor fusion tilt & touch
   */
  public update(
    delta: number,
    motion: MotionData | undefined,
    input: TouchPointerState | undefined,
    parallaxStrength: number,
    depthStrength: number,
    accessibility: AccessibilitySettings
  ): void {
    if (accessibility.disableParallax || accessibility.reducedMotion || parallaxStrength <= 0.001) {
      this.smoothedOffset.set(0, 0);
      this.layers.forEach((layer) => {
        layer.group.position.x = 0;
        layer.group.position.y = 0;
      });
      return;
    }

    // Motion Sensor + Touch fusion
    const tiltX = motion?.tiltX ?? 0;
    const tiltY = motion?.tiltY ?? 0;
    const touchX = input?.x ?? 0;
    const touchY = input?.y ?? 0;

    const targetX = (tiltX * 1.2 + touchX * 0.8) * parallaxStrength;
    const targetY = (tiltY * 0.9 + touchY * 0.6) * parallaxStrength;

    const damping = Math.min(1.0, delta * 4.5);
    this.smoothedOffset.x += (targetX - this.smoothedOffset.x) * damping;
    this.smoothedOffset.y += (targetY - this.smoothedOffset.y) * damping;

    // Apply differential parallax displacement across each layer depth
    this.layers.forEach((layer) => {
      const mult = layer.parallaxMultiplier * depthStrength;
      layer.group.position.x = this.smoothedOffset.x * mult;
      layer.group.position.y = this.smoothedOffset.y * mult;
    });
  }

  public dispose(): void {
    this.layers.forEach((layer) => {
      this.rootGroup.remove(layer.group);
    });
    this.layers.clear();
  }
}
