import * as THREE from 'three';
import { CollisionManager } from './CollisionManager';
import { ForceFieldManager } from './ForceFieldManager';
import { GravitySystem } from './GravitySystem';
import { WindSystem } from './WindSystem';
import { ShockwaveSystem } from './ShockwaveSystem';

export interface DynamicBody {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  mass: number;
  radius: number;
  mesh?: THREE.Object3D;
  isStatic: boolean;
}

export class PhysicsWorld {
  private dynamicBodies: Map<string, DynamicBody> = new Map();
  private tempForce: THREE.Vector3 = new THREE.Vector3();
  private tempGravity: THREE.Vector3 = new THREE.Vector3();
  private tempWind: THREE.Vector3 = new THREE.Vector3();
  private tempShock: THREE.Vector3 = new THREE.Vector3();

  constructor() {}

  public addBody(body: DynamicBody): void {
    this.dynamicBodies.set(body.id, body);
  }

  public removeBody(id: string): void {
    this.dynamicBodies.delete(id);
  }

  public getBody(id: string): DynamicBody | undefined {
    return this.dynamicBodies.get(id);
  }

  public getAllBodies(): DynamicBody[] {
    return Array.from(this.dynamicBodies.values());
  }

  public clear(): void {
    this.dynamicBodies.clear();
  }

  public step(
    delta: number,
    time: number,
    gravity: GravitySystem,
    wind: WindSystem,
    forces: ForceFieldManager,
    shockwaves: ShockwaveSystem,
    collision: CollisionManager,
    simSpeed: number = 1.0
  ): void {
    const dt = Math.min(delta * simSpeed, 0.05);

    for (const body of this.dynamicBodies.values()) {
      if (body.isStatic) continue;

      // 1. Compute forces
      gravity.getGravityAt(body.position, this.tempGravity);
      wind.getWindAt(body.position, time, this.tempWind);
      shockwaves.applyShockwaveForce(body.position, body.velocity, this.tempShock);
      forces.calculateAccumulatedForce(
        body.position,
        body.velocity,
        body.mass,
        this.tempForce,
        time
      );

      // Total acceleration = F / m
      const accX = (this.tempGravity.x + this.tempWind.x + this.tempShock.x + this.tempForce.x) / body.mass;
      const accY = (this.tempGravity.y + this.tempWind.y + this.tempShock.y + this.tempForce.y) / body.mass;
      const accZ = (this.tempGravity.z + this.tempWind.z + this.tempShock.z + this.tempForce.z) / body.mass;

      // Integrate velocity
      body.velocity.x += accX * dt;
      body.velocity.y += accY * dt;
      body.velocity.z += accZ * dt;

      // Slight damping
      body.velocity.multiplyScalar(0.995);

      // Integrate position
      body.position.addScaledVector(body.velocity, dt);

      // Collisions with world
      collision.resolveParticleCollision(body.position, body.velocity, body.radius);

      // Sync 3D mesh if present
      if (body.mesh) {
        body.mesh.position.copy(body.position);
        body.mesh.rotation.x += body.angularVelocity.x * dt;
        body.mesh.rotation.y += body.angularVelocity.y * dt;
        body.mesh.rotation.z += body.angularVelocity.z * dt;
      }
    }
  }
}
