import * as THREE from 'three';

export interface PathWaypoint {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
  fov?: number;
}

export class CameraPathSystem {
  private curve: THREE.CatmullRomCurve3 | null = null;
  private lookAtCurve: THREE.CatmullRomCurve3 | null = null;
  private progress: number = 0; // 0.0 to 1.0
  private currentPathType: string = 'orbit-spiral';

  // Procedural sampled points
  private currentSampledPos = new THREE.Vector3();
  private currentSampledLookAt = new THREE.Vector3();

  constructor() {
    this.generatePath('orbit-spiral');
  }

  /**
   * Procedurally generate a closed CatmullRom spline path based on archetype
   */
  public generatePath(type: 'orbit-spiral' | 'infinity-sweep' | 'fly-through' | 'macro-arc' | 'galaxy-spiral'): void {
    this.currentPathType = type;
    const posPoints: THREE.Vector3[] = [];
    const lookPoints: THREE.Vector3[] = [];

    switch (type) {
      case 'orbit-spiral': {
        const turns = 2;
        const count = 12;
        for (let i = 0; i < count; i++) {
          const theta = (i / count) * Math.PI * 2 * turns;
          const radius = 5.5 + Math.sin(i * 0.8) * 1.5;
          const y = Math.sin(theta * 0.5) * 2.2 + 0.5;
          posPoints.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius));
          lookPoints.push(new THREE.Vector3(0, Math.sin(i * 0.5) * 0.5, 0));
        }
        break;
      }
      case 'infinity-sweep': {
        const count = 16;
        for (let i = 0; i < count; i++) {
          const t = (i / count) * Math.PI * 2;
          const scale = 5.0;
          const x = (scale * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t));
          const z = (scale * Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t));
          const y = Math.sin(t * 2) * 1.8 + 1.0;
          posPoints.push(new THREE.Vector3(x, y, z + 3.0));
          lookPoints.push(new THREE.Vector3(x * 0.2, 0, z * 0.2));
        }
        break;
      }
      case 'fly-through': {
        posPoints.push(
          new THREE.Vector3(0, 1.5, 12.0),
          new THREE.Vector3(3.0, 2.5, 6.0),
          new THREE.Vector3(-2.5, 0.8, 1.0),
          new THREE.Vector3(1.0, -1.0, -4.0),
          new THREE.Vector3(-3.0, 1.2, -8.0),
          new THREE.Vector3(0, 2.0, -12.0),
          new THREE.Vector3(4.0, 3.0, 0.0)
        );
        for (let i = 0; i < posPoints.length; i++) {
          const nextIdx = (i + 1) % posPoints.length;
          const dir = posPoints[nextIdx].clone().sub(posPoints[i]).normalize().multiplyScalar(4.0);
          lookPoints.push(posPoints[i].clone().add(dir));
        }
        break;
      }
      case 'macro-arc': {
        const count = 8;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const radius = 2.2 + Math.cos(angle * 2) * 0.6;
          const y = Math.sin(angle) * 0.8;
          posPoints.push(new THREE.Vector3(Math.sin(angle) * radius, y, Math.cos(angle) * radius));
          lookPoints.push(new THREE.Vector3(0, 0, 0));
        }
        break;
      }
      case 'galaxy-spiral': {
        const count = 14;
        for (let i = 0; i < count; i++) {
          const u = i / count;
          const angle = u * Math.PI * 4;
          const r = 3.0 + u * 6.0;
          const y = 3.5 - u * 4.0;
          posPoints.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
          lookPoints.push(new THREE.Vector3(0, 0, 0));
        }
        break;
      }
    }

    this.curve = new THREE.CatmullRomCurve3(posPoints, true, 'centripetal');
    this.lookAtCurve = new THREE.CatmullRomCurve3(lookPoints, true, 'centripetal');
    this.progress = 0;
  }

  /**
   * Sample position and look-at smoothly along path
   */
  public update(delta: number, speedMultiplier: number): { position: THREE.Vector3; lookAt: THREE.Vector3; progress: number } {
    if (!this.curve || !this.lookAtCurve) {
      return {
        position: new THREE.Vector3(0, 0, 5),
        lookAt: new THREE.Vector3(0, 0, 0),
        progress: 0
      };
    }

    // Advance normalized progress with speed
    const advanceRate = (0.025 * speedMultiplier * delta);
    this.progress = (this.progress + advanceRate) % 1.0;

    this.curve.getPointAt(this.progress, this.currentSampledPos);
    this.lookAtCurve.getPointAt(this.progress, this.currentSampledLookAt);

    return {
      position: this.currentSampledPos,
      lookAt: this.currentSampledLookAt,
      progress: this.progress
    };
  }

  public getProgress(): number {
    return this.progress;
  }

  public setProgress(p: number): void {
    this.progress = Math.max(0, Math.min(1, p));
  }
}
