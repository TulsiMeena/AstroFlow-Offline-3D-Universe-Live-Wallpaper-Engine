import * as THREE from 'three';
import { QualityConfig } from '../types/engine';
import { ForceFieldManager } from './ForceFieldManager';
import { GravitySystem } from './GravitySystem';
import { WindSystem } from './WindSystem';
import { ShockwaveSystem } from './ShockwaveSystem';
import { CollisionManager } from './CollisionManager';

export class ParticlePhysicsSystem {
  private group: THREE.Group;
  private pointsMesh: THREE.Points | null = null;
  private maxParticles: number = 2000;
  private activeCount: number = 0;

  // Float32 arrays for high-performance contiguous memory
  private positions: Float32Array;
  private velocities: Float32Array;
  private accelerations: Float32Array;
  private colors: Float32Array;
  private lifetimes: Float32Array;
  private maxLifetimes: Float32Array;
  private masses: Float32Array;

  // Geometry attributes
  private posAttr: THREE.BufferAttribute | null = null;
  private colAttr: THREE.BufferAttribute | null = null;

  // Reusable vectors
  private tempPoint: THREE.Vector3 = new THREE.Vector3();
  private tempVel: THREE.Vector3 = new THREE.Vector3();
  private tempForce: THREE.Vector3 = new THREE.Vector3();
  private tempGravity: THREE.Vector3 = new THREE.Vector3();
  private tempWind: THREE.Vector3 = new THREE.Vector3();
  private tempShockwave: THREE.Vector3 = new THREE.Vector3();

  constructor(quality: QualityConfig) {
    this.group = new THREE.Group();
    this.group.name = 'ParticlePhysics_Group';

    this.configureQuality(quality);

    this.positions = new Float32Array(this.maxParticles * 3);
    this.velocities = new Float32Array(this.maxParticles * 3);
    this.accelerations = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.lifetimes = new Float32Array(this.maxParticles);
    this.maxLifetimes = new Float32Array(this.maxParticles);
    this.masses = new Float32Array(this.maxParticles);

    this.initMesh();
    this.spawnInitialParticles();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public configureQuality(quality: QualityConfig): void {
    if (quality.profile === 'LOW') this.maxParticles = 600;
    else if (quality.profile === 'MEDIUM') this.maxParticles = 1200;
    else if (quality.profile === 'HIGH') this.maxParticles = 2400;
    else this.maxParticles = 4000;
  }

  private initMesh(): void {
    const geo = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(this.positions, 3);
    this.colAttr = new THREE.BufferAttribute(this.colors, 3);

    geo.setAttribute('position', this.posAttr);
    geo.setAttribute('color', this.colAttr);

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.pointsMesh = new THREE.Points(geo, mat);
    this.group.add(this.pointsMesh);
  }

  public spawnInitialParticles(): void {
    this.activeCount = Math.floor(this.maxParticles * 0.7);
    for (let i = 0; i < this.activeCount; i++) {
      this.resetParticle(i, true);
    }
  }

  private resetParticle(i: number, randomPosition: boolean = false): void {
    const idx3 = i * 3;
    if (randomPosition) {
      this.positions[idx3] = (Math.random() - 0.5) * 16;
      this.positions[idx3 + 1] = Math.random() * 8 - 3;
      this.positions[idx3 + 2] = (Math.random() - 0.5) * 16;
    } else {
      this.positions[idx3] = (Math.random() - 0.5) * 2;
      this.positions[idx3 + 1] = 6 + Math.random() * 2;
      this.positions[idx3 + 2] = (Math.random() - 0.5) * 2;
    }

    this.velocities[idx3] = (Math.random() - 0.5) * 1.5;
    this.velocities[idx3 + 1] = (Math.random() - 0.5) * 1.5;
    this.velocities[idx3 + 2] = (Math.random() - 0.5) * 1.5;

    this.accelerations[idx3] = 0;
    this.accelerations[idx3 + 1] = 0;
    this.accelerations[idx3 + 2] = 0;

    const hue = (i / this.maxParticles) * 0.7 + 0.5; // vibrant cyan to purple gradient
    const tempCol = new THREE.Color().setHSL(hue % 1.0, 0.9, 0.65);
    this.colors[idx3] = tempCol.r;
    this.colors[idx3 + 1] = tempCol.g;
    this.colors[idx3 + 2] = tempCol.b;

    this.lifetimes[i] = 4.0 + Math.random() * 8.0;
    this.maxLifetimes[i] = this.lifetimes[i];
    this.masses[i] = 0.5 + Math.random() * 1.0;
  }

  /**
   * Emit trail particles from user touch drag or swipe
   */
  public emitAt(origin: THREE.Vector3, count: number = 8, colorHex: number = 0x00f0ff): void {
    const col = new THREE.Color(colorHex);
    let spawned = 0;

    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      if (this.lifetimes[i] <= 0 || i >= this.activeCount) {
        const idx3 = i * 3;
        this.positions[idx3] = origin.x + (Math.random() - 0.5) * 0.4;
        this.positions[idx3 + 1] = origin.y + (Math.random() - 0.5) * 0.4;
        this.positions[idx3 + 2] = origin.z + (Math.random() - 0.5) * 0.4;

        this.velocities[idx3] = (Math.random() - 0.5) * 3.0;
        this.velocities[idx3 + 1] = 1.0 + Math.random() * 2.5;
        this.velocities[idx3 + 2] = (Math.random() - 0.5) * 3.0;

        this.colors[idx3] = col.r;
        this.colors[idx3 + 1] = col.g;
        this.colors[idx3 + 2] = col.b;

        this.lifetimes[i] = 2.5 + Math.random() * 3.0;
        this.maxLifetimes[i] = this.lifetimes[i];
        this.masses[i] = 0.8;

        if (i >= this.activeCount) {
          this.activeCount = Math.min(this.maxParticles, this.activeCount + 1);
        }
        spawned++;
      }
    }
  }

  public update(
    delta: number,
    time: number,
    forces: ForceFieldManager,
    gravity: GravitySystem,
    wind: WindSystem,
    shockwaves: ShockwaveSystem,
    collision: CollisionManager,
    dragCoeff: number = 0.02,
    simSpeed: number = 1.0
  ): void {
    const dt = Math.min(delta * simSpeed, 0.05);

    for (let i = 0; i < this.activeCount; i++) {
      const idx3 = i * 3;

      this.lifetimes[i] -= dt;
      if (this.lifetimes[i] <= 0) {
        this.resetParticle(i, true);
      }

      this.tempPoint.set(
        this.positions[idx3],
        this.positions[idx3 + 1],
        this.positions[idx3 + 2]
      );
      this.tempVel.set(
        this.velocities[idx3],
        this.velocities[idx3 + 1],
        this.velocities[idx3 + 2]
      );

      const mass = this.masses[i];

      // 1. Gravity Force
      gravity.getGravityAt(this.tempPoint, this.tempGravity);

      // 2. Wind Force
      wind.getWindAt(this.tempPoint, time, this.tempWind);

      // 3. Shockwave Impulses
      shockwaves.applyShockwaveForce(this.tempPoint, this.tempVel, this.tempShockwave);

      // 4. Force Fields
      forces.calculateAccumulatedForce(
        this.tempPoint,
        this.tempVel,
        mass,
        this.tempForce,
        time
      );

      // Total Acceleration = (Sum of Forces) / mass
      const accX = (this.tempGravity.x + this.tempWind.x + this.tempShockwave.x + this.tempForce.x) / mass;
      const accY = (this.tempGravity.y + this.tempWind.y + this.tempShockwave.y + this.tempForce.y) / mass;
      const accZ = (this.tempGravity.z + this.tempWind.z + this.tempShockwave.z + this.tempForce.z) / mass;

      // Semi-implicit Euler integration
      this.tempVel.x += accX * dt;
      this.tempVel.y += accY * dt;
      this.tempVel.z += accZ * dt;

      // Apply air drag
      const dragFactor = Math.max(0, 1.0 - dragCoeff * dt * 60);
      this.tempVel.multiplyScalar(dragFactor);

      // Integrate position
      this.tempPoint.addScaledVector(this.tempVel, dt);

      // Collisions with world objects
      collision.resolveParticleCollision(this.tempPoint, this.tempVel, 0.1);

      // Save back
      this.positions[idx3] = this.tempPoint.x;
      this.positions[idx3 + 1] = this.tempPoint.y;
      this.positions[idx3 + 2] = this.tempPoint.z;

      this.velocities[idx3] = this.tempVel.x;
      this.velocities[idx3 + 1] = this.tempVel.y;
      this.velocities[idx3 + 2] = this.tempVel.z;
    }

    if (this.posAttr) this.posAttr.needsUpdate = true;
    if (this.colAttr) this.colAttr.needsUpdate = true;
  }
}
