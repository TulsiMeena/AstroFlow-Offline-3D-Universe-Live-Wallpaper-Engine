import * as THREE from 'three';
import { QualityProfile } from '../types/engine';
import { SmartFPSTarget } from './types';

export class RenderBudgetManager {
  private frustum: THREE.Frustum = new THREE.Frustum();
  private projScreenMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private targetFrameBudgetMs: number = 16.6;
  private currentAdaptiveResolution: number = 1.0;
  private minResolutionScale: number = 0.65;
  private maxResolutionScale: number = 1.0;

  constructor() {}

  public setTargetFPS(fps: SmartFPSTarget) {
    this.targetFrameBudgetMs = 1000 / fps;
  }

  public updateFrustum(camera: THREE.Camera) {
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
  }

  public isObjectVisible(sphereOrBox: THREE.Sphere | THREE.Box3): boolean {
    if (sphereOrBox instanceof THREE.Sphere) {
      return this.frustum.intersectsSphere(sphereOrBox);
    }
    return this.frustum.intersectsBox(sphereOrBox);
  }

  public isPointVisible(point: THREE.Vector3, margin: number = 2.0): boolean {
    return this.frustum.containsPoint(point);
  }

  public calculateLODLevel(distanceToCamera: number): 'NEAR' | 'MEDIUM' | 'FAR' {
    if (distanceToCamera < 25) return 'NEAR';
    if (distanceToCamera < 65) return 'MEDIUM';
    return 'FAR';
  }

  /**
   * Adjust resolution adaptively if frame times consistently breach target budget
   */
  public evaluateFrameBudget(frameTimeMs: number, profileScale: number = 1.0): number {
    const budget = this.targetFrameBudgetMs;
    if (frameTimeMs > budget * 1.25) {
      // Over budget -> scale down resolution slightly
      this.currentAdaptiveResolution = Math.max(
        this.minResolutionScale,
        this.currentAdaptiveResolution - 0.05
      );
    } else if (frameTimeMs < budget * 0.75 && this.currentAdaptiveResolution < profileScale) {
      // Well within budget -> smoothly recover resolution
      this.currentAdaptiveResolution = Math.min(
        profileScale,
        this.currentAdaptiveResolution + 0.02
      );
    }
    return this.currentAdaptiveResolution;
  }

  public getAdaptiveResolution(): number {
    return this.currentAdaptiveResolution;
  }

  public resetAdaptiveResolution(baseScale: number = 1.0) {
    this.currentAdaptiveResolution = baseScale;
  }
}
