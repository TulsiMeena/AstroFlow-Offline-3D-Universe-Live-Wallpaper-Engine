import * as THREE from 'three';
import { EnvironmentDNA } from './types/environmentDNA';
import { GeneratedEnvironment } from './EnvironmentGenerator';

export class EnvironmentTransitionManager {
  private isTransitioning: boolean = false;
  private transitionProgress: number = 0;
  private transitionDuration: number = 1.2; // seconds

  private currentEnv: GeneratedEnvironment | null = null;
  private targetEnv: GeneratedEnvironment | null = null;
  private onCompleteCallback: (() => void) | null = null;

  public startTransition(
    fromEnv: GeneratedEnvironment,
    toEnv: GeneratedEnvironment,
    duration: number = 1.2,
    onComplete?: () => void
  ) {
    this.currentEnv = fromEnv;
    this.targetEnv = toEnv;
    this.transitionDuration = duration;
    this.transitionProgress = 0;
    this.isTransitioning = true;
    this.onCompleteCallback = onComplete || null;

    // Prepare target environment root
    this.targetEnv.rootGroup.scale.set(0.8, 0.8, 0.8);
    this.setGroupOpacity(this.targetEnv.rootGroup, 0.0);
  }

  public update(delta: number): boolean {
    if (!this.isTransitioning || !this.currentEnv || !this.targetEnv) {
      return false;
    }

    this.transitionProgress += delta / this.transitionDuration;
    const t = Math.min(1.0, this.transitionProgress);

    // Smoothstep curve
    const smoothT = t * t * (3 - 2 * t);

    // Fade out old environment
    this.setGroupOpacity(this.currentEnv.rootGroup, 1.0 - smoothT);
    this.currentEnv.rootGroup.scale.setScalar(1.0 + smoothT * 0.1);

    // Fade in new environment
    this.setGroupOpacity(this.targetEnv.rootGroup, smoothT);
    this.targetEnv.rootGroup.scale.setScalar(0.8 + smoothT * 0.2);

    if (t >= 1.0) {
      this.isTransitioning = false;
      this.setGroupOpacity(this.targetEnv.rootGroup, 1.0);
      this.targetEnv.rootGroup.scale.setScalar(1.0);

      // Clean up old environment
      this.currentEnv.dispose();

      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
      return true; // completed
    }

    return false;
  }

  public isInTransition(): boolean {
    return this.isTransitioning;
  }

  public getProgress(): number {
    return this.transitionProgress;
  }

  private setGroupOpacity(group: THREE.Group, opacity: number) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            m.transparent = true;
            m.opacity = Math.max(0, Math.min(1, opacity));
          });
        } else if (child.material) {
          child.material.transparent = true;
          child.material.opacity = Math.max(0, Math.min(1, opacity));
        }
      } else if (child instanceof THREE.Points) {
        if (child.material instanceof THREE.Material) {
          child.material.transparent = true;
          (child.material as THREE.PointsMaterial).opacity = Math.max(0, Math.min(1, opacity));
        }
      }
    });
  }
}
