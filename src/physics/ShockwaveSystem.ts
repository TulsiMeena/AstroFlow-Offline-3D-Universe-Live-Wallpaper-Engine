import * as THREE from 'three';
import { ShockwaveInstance } from './types';

export class ShockwaveSystem {
  private group: THREE.Group;
  private shockwaves: ShockwaveInstance[] = [];
  private maxShockwaves: number = 8;
  private cooldownTimer: number = 0;
  private minCooldown: number = 0.15; // prevents accidental overload
  private ringGeometry: THREE.RingGeometry;
  private tempVec: THREE.Vector3 = new THREE.Vector3();

  // Listeners for shockwave dispatch (for ecosystem, camera, environments)
  private listeners: ((wave: ShockwaveInstance) => void)[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ShockwaveSystem_Group';
    // Shared reusable geometry for rings
    this.ringGeometry = new THREE.RingGeometry(0.85, 1.0, 32);
    this.ringGeometry.rotateX(-Math.PI / 2);
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public subscribe(callback: (wave: ShockwaveInstance) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public triggerShockwave(params: {
    origin: THREE.Vector3;
    maxRadius?: number;
    speed?: number;
    strength?: number;
    color?: number;
  }): ShockwaveInstance | null {
    if (this.cooldownTimer > 0) return null;
    if (this.shockwaves.length >= this.maxShockwaves) {
      // Remove oldest
      this.removeShockwave(this.shockwaves[0]);
    }

    this.cooldownTimer = this.minCooldown;

    const maxRadius = params.maxRadius || 14.0;
    const speed = params.speed || 16.0;
    const strength = params.strength || 2.5;
    const color = params.color || 0x00f0ff;
    const lifetime = maxRadius / speed;

    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(this.ringGeometry, mat);
    mesh.position.copy(params.origin);
    mesh.scale.setScalar(0.1);
    this.group.add(mesh);

    const wave: ShockwaveInstance = {
      id: `wave_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      origin: params.origin.clone(),
      currentRadius: 0.1,
      maxRadius,
      speed,
      strength,
      elapsed: 0,
      lifetime,
      color,
      mesh,
    };

    this.shockwaves.push(wave);

    // Notify listeners
    this.listeners.forEach((cb) => cb(wave));

    return wave;
  }

  private removeShockwave(wave: ShockwaveInstance): void {
    if (wave.mesh) {
      this.group.remove(wave.mesh);
      if (wave.mesh.material instanceof THREE.Material) {
        wave.mesh.material.dispose();
      }
    }
    const idx = this.shockwaves.indexOf(wave);
    if (idx !== -1) {
      this.shockwaves.splice(idx, 1);
    }
  }

  public update(delta: number): void {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer = Math.max(0, this.cooldownTimer - delta);
    }

    const toRemove: ShockwaveInstance[] = [];

    for (const wave of this.shockwaves) {
      wave.elapsed += delta;
      wave.currentRadius += wave.speed * delta;

      const progress = wave.elapsed / wave.lifetime;

      if (progress >= 1.0 || wave.currentRadius >= wave.maxRadius) {
        toRemove.push(wave);
        continue;
      }

      if (wave.mesh) {
        wave.mesh.scale.setScalar(wave.currentRadius);
        const mat = wave.mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          // Fade out towards end of life
          mat.opacity = (1.0 - progress) * 0.85;
        }
      }
    }

    toRemove.forEach((w) => this.removeShockwave(w));
  }

  /**
   * Apply radial displacement force from all active shockwaves onto a point
   */
  public applyShockwaveForce(
    point: THREE.Vector3,
    velocity: THREE.Vector3,
    outImpulse: THREE.Vector3
  ): void {
    outImpulse.set(0, 0, 0);

    for (const wave of this.shockwaves) {
      this.tempVec.subVectors(point, wave.origin);
      const dist = this.tempVec.length();

      // Shockwave front thickness
      const waveThickness = 2.0;
      const distFromFront = Math.abs(dist - wave.currentRadius);

      if (distFromFront < waveThickness && dist > 0.01) {
        const falloff = 1.0 - distFromFront / waveThickness;
        const remainingPower = (1.0 - wave.elapsed / wave.lifetime) * wave.strength;
        const push = falloff * remainingPower * 12.0;

        this.tempVec.normalize().multiplyScalar(push);
        outImpulse.add(this.tempVec);
      }
    }
  }

  public getActiveShockwaves(): ShockwaveInstance[] {
    return this.shockwaves;
  }

  public clear(): void {
    for (const wave of [...this.shockwaves]) {
      this.removeShockwave(wave);
    }
    this.shockwaves = [];
  }
}
