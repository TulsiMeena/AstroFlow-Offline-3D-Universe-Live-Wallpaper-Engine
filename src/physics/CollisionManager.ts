import * as THREE from 'three';
import { Collider, CollisionSphere, CollisionBox, CollisionPlane } from './types';

export class CollisionManager {
  private colliders: Map<string, Collider> = new Map();
  private debugGroup: THREE.Group;
  private debugVisualsEnabled: boolean = false;
  private debugMeshes: Map<string, THREE.Object3D> = new Map();

  // Temporary calculation vectors
  private tempDiff: THREE.Vector3 = new THREE.Vector3();
  private tempNormal: THREE.Vector3 = new THREE.Vector3();
  private tempClosest: THREE.Vector3 = new THREE.Vector3();

  constructor() {
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = 'Collision_Debug_Group';

    // Default ground plane at y = -6.0
    this.addPlaneCollider({
      id: 'default_ground',
      normal: new THREE.Vector3(0, 1, 0),
      distance: -6.0,
      restitution: 0.6,
      friction: 0.2,
    });
  }

  public getDebugGroup(): THREE.Group {
    return this.debugGroup;
  }

  public setDebugVisuals(enabled: boolean): void {
    this.debugVisualsEnabled = enabled;
    this.debugGroup.visible = enabled;
    if (enabled) {
      this.rebuildDebugVisuals();
    } else {
      this.clearDebugMeshes();
    }
  }

  public addSphereCollider(params: {
    id?: string;
    position: THREE.Vector3;
    radius: number;
    restitution?: number;
    friction?: number;
    isDynamic?: boolean;
    velocity?: THREE.Vector3;
  }): CollisionSphere {
    const id = params.id || `sphere_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const sphere: CollisionSphere = {
      id,
      type: 'sphere',
      position: params.position.clone(),
      radius: params.radius,
      restitution: params.restitution ?? 0.7,
      friction: params.friction ?? 0.15,
      isDynamic: params.isDynamic ?? false,
      velocity: params.velocity?.clone() || new THREE.Vector3(),
    };

    this.colliders.set(id, sphere);
    if (this.debugVisualsEnabled) {
      this.createSphereDebugMesh(sphere);
    }
    return sphere;
  }

  public addBoxCollider(params: {
    id?: string;
    position: THREE.Vector3;
    size: THREE.Vector3;
    restitution?: number;
    friction?: number;
    isDynamic?: boolean;
  }): CollisionBox {
    const id = params.id || `box_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const box: CollisionBox = {
      id,
      type: 'box',
      position: params.position.clone(),
      size: params.size.clone(),
      restitution: params.restitution ?? 0.6,
      friction: params.friction ?? 0.2,
      isDynamic: params.isDynamic ?? false,
    };

    this.colliders.set(id, box);
    if (this.debugVisualsEnabled) {
      this.createBoxDebugMesh(box);
    }
    return box;
  }

  public addPlaneCollider(params: {
    id?: string;
    normal: THREE.Vector3;
    distance: number;
    restitution?: number;
    friction?: number;
  }): CollisionPlane {
    const id = params.id || `plane_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const plane: CollisionPlane = {
      id,
      type: 'plane',
      normal: params.normal.clone().normalize(),
      distance: params.distance,
      restitution: params.restitution ?? 0.5,
      friction: params.friction ?? 0.3,
    };

    this.colliders.set(id, plane);
    return plane;
  }

  public removeCollider(id: string): void {
    const mesh = this.debugMeshes.get(id);
    if (mesh) {
      this.debugGroup.remove(mesh);
      this.debugMeshes.delete(id);
    }
    this.colliders.delete(id);
  }

  public clear(): void {
    this.clearDebugMeshes();
    this.colliders.clear();
  }

  private clearDebugMeshes(): void {
    while (this.debugGroup.children.length > 0) {
      this.debugGroup.remove(this.debugGroup.children[0]);
    }
    this.debugMeshes.clear();
  }

  private rebuildDebugVisuals(): void {
    this.clearDebugMeshes();
    for (const collider of this.colliders.values()) {
      if (collider.type === 'sphere') this.createSphereDebugMesh(collider);
      else if (collider.type === 'box') this.createBoxDebugMesh(collider);
    }
  }

  private createSphereDebugMesh(sphere: CollisionSphere): void {
    const geo = new THREE.SphereGeometry(sphere.radius, 12, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(sphere.position);
    this.debugMeshes.set(sphere.id, mesh);
    this.debugGroup.add(mesh);
  }

  private createBoxDebugMesh(box: CollisionBox): void {
    const geo = new THREE.BoxGeometry(box.size.x, box.size.y, box.size.z);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(box.position);
    this.debugMeshes.set(box.id, mesh);
    this.debugGroup.add(mesh);
  }

  /**
   * Fast particle collision against spheres, boxes, and planes
   */
  public resolveParticleCollision(
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    particleRadius: number = 0.05
  ): boolean {
    let collided = false;

    for (const collider of this.colliders.values()) {
      if (collider.type === 'plane') {
        // Plane equation: dot(pos, normal) - distance
        const dist = pos.dot(collider.normal) - collider.distance;
        if (dist < particleRadius) {
          collided = true;
          // Push out of plane
          pos.addScaledVector(collider.normal, particleRadius - dist);
          // Reflect velocity
          const vDotN = vel.dot(collider.normal);
          if (vDotN < 0) {
            vel.addScaledVector(collider.normal, -(1 + collider.restitution) * vDotN);
            // Apply friction perpendicular to normal
            vel.multiplyScalar(1.0 - collider.friction);
          }
        }
      } else if (collider.type === 'sphere') {
        this.tempDiff.subVectors(pos, collider.position);
        const dist = this.tempDiff.length();
        const minDist = collider.radius + particleRadius;

        if (dist < minDist && dist > 0.0001) {
          collided = true;
          this.tempNormal.copy(this.tempDiff).normalize();
          // Reposition outside
          pos.copy(collider.position).addScaledVector(this.tempNormal, minDist);

          // Bounce velocity along normal
          const vDotN = vel.dot(this.tempNormal);
          if (vDotN < 0) {
            vel.addScaledVector(this.tempNormal, -(1 + collider.restitution) * vDotN);
            vel.multiplyScalar(1.0 - collider.friction);
          }
        }
      } else if (collider.type === 'box') {
        // AABB test
        const halfX = collider.size.x * 0.5;
        const halfY = collider.size.y * 0.5;
        const halfZ = collider.size.z * 0.5;

        const minX = collider.position.x - halfX;
        const maxX = collider.position.x + halfX;
        const minY = collider.position.y - halfY;
        const maxY = collider.position.y + halfY;
        const minZ = collider.position.z - halfZ;
        const maxZ = collider.position.z + halfZ;

        if (
          pos.x > minX - particleRadius &&
          pos.x < maxX + particleRadius &&
          pos.y > minY - particleRadius &&
          pos.y < maxY + particleRadius &&
          pos.z > minZ - particleRadius &&
          pos.z < maxZ + particleRadius
        ) {
          collided = true;
          // Find closest point on box
          this.tempClosest.set(
            Math.max(minX, Math.min(pos.x, maxX)),
            Math.max(minY, Math.min(pos.y, maxY)),
            Math.max(minZ, Math.min(pos.z, maxZ))
          );

          this.tempDiff.subVectors(pos, this.tempClosest);
          let dist = this.tempDiff.length();
          if (dist < 0.0001) {
            this.tempNormal.set(0, 1, 0);
          } else {
            this.tempNormal.copy(this.tempDiff).normalize();
          }

          pos.copy(this.tempClosest).addScaledVector(this.tempNormal, particleRadius);
          const vDotN = vel.dot(this.tempNormal);
          if (vDotN < 0) {
            vel.addScaledVector(this.tempNormal, -(1 + collider.restitution) * vDotN);
            vel.multiplyScalar(1.0 - collider.friction);
          }
        }
      }
    }

    return collided;
  }
}
