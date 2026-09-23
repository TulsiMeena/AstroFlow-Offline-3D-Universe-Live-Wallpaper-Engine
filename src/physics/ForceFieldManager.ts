import * as THREE from 'three';
import { ForceField, ForceFieldType, FalloffType } from './types';

export class ForceFieldManager {
  private fields: Map<string, ForceField> = new Map();
  private debugGroup: THREE.Group;
  private debugVisualsEnabled: boolean = false;
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private tangentVec: THREE.Vector3 = new THREE.Vector3();
  private upAxis: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  constructor() {
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = 'ForceField_Debug_Group';
  }

  public getDebugGroup(): THREE.Group {
    return this.debugGroup;
  }

  public setDebugVisuals(enabled: boolean): void {
    this.debugVisualsEnabled = enabled;
    this.debugGroup.visible = enabled;
    if (!enabled) {
      // Clear visual meshes
      while (this.debugGroup.children.length > 0) {
        const child = this.debugGroup.children[0];
        this.debugGroup.remove(child);
      }
    }
  }

  public addForceField(params: {
    id?: string;
    type: ForceFieldType;
    position: THREE.Vector3;
    strength: number;
    radius: number;
    falloff?: FalloffType;
    lifetime?: number;
    direction?: THREE.Vector3;
    angularVelocity?: number;
    color?: number;
  }): ForceField {
    const id = params.id || `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Default colors per force type
    const colors: Record<ForceFieldType, number> = {
      gravity: 0x8a2be2,
      attraction: 0x00f0ff,
      repulsion: 0xff0055,
      vortex: 0x00ff88,
      turbulence: 0xffaa00,
      wind: 0x70d6ff,
      drag: 0x666666,
      impulse: 0xffdd00,
      orbital: 0xd946ef,
      magnetic: 0x4cc9f0,
      shockwave: 0xff3366,
    };

    const field: ForceField = {
      id,
      type: params.type,
      position: params.position.clone(),
      strength: params.strength,
      radius: params.radius,
      falloff: params.falloff || 'linear',
      lifetime: params.lifetime || 0,
      maxLifetime: params.lifetime || 0,
      direction: params.direction ? params.direction.clone().normalize() : new THREE.Vector3(0, 1, 0),
      angularVelocity: params.angularVelocity ?? 2.0,
      active: true,
      color: params.color ?? colors[params.type],
    };

    if (this.debugVisualsEnabled) {
      this.createDebugGizmo(field);
    }

    this.fields.set(id, field);
    return field;
  }

  private createDebugGizmo(field: ForceField): void {
    const geo = new THREE.RingGeometry(field.radius * 0.95, field.radius, 24);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: field.color || 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(field.position);
    field.debugMesh = mesh;
    this.debugGroup.add(mesh);
  }

  public removeForceField(id: string): void {
    const field = this.fields.get(id);
    if (field && field.debugMesh) {
      this.debugGroup.remove(field.debugMesh);
    }
    this.fields.delete(id);
  }

  public getField(id: string): ForceField | undefined {
    return this.fields.get(id);
  }

  public getAllFields(): ForceField[] {
    return Array.from(this.fields.values());
  }

  public clear(): void {
    while (this.debugGroup.children.length > 0) {
      this.debugGroup.remove(this.debugGroup.children[0]);
    }
    this.fields.clear();
  }

  public update(delta: number): void {
    const expiredIds: string[] = [];

    this.fields.forEach((field) => {
      if (!field.active) return;

      if (field.maxLifetime > 0) {
        field.lifetime -= delta;
        if (field.lifetime <= 0) {
          expiredIds.push(field.id);
          return;
        }
      }

      // Rotate debug mesh if vortex or orbital
      if (field.debugMesh) {
        if (field.type === 'vortex' || field.type === 'orbital') {
          field.debugMesh.rotation.y += delta * (field.angularVelocity || 1.5);
        }
        // Pulse scale slightly if shockwave
        if (field.type === 'shockwave' && field.maxLifetime > 0) {
          const progress = 1 - field.lifetime / field.maxLifetime;
          field.debugMesh.scale.setScalar(1 + progress * 0.5);
        }
      }
    });

    expiredIds.forEach((id) => this.removeForceField(id));
  }

  /**
   * Fast accumulation of all procedural forces acting on a test point
   */
  public calculateAccumulatedForce(
    point: THREE.Vector3,
    velocity: THREE.Vector3,
    mass: number,
    outForce: THREE.Vector3,
    time: number = 0
  ): THREE.Vector3 {
    outForce.set(0, 0, 0);

    for (const field of this.fields.values()) {
      if (!field.active) continue;

      this.tempVec.subVectors(field.position, point);
      const dist = this.tempVec.length();

      if (dist > field.radius) continue;

      // Calculate falloff multiplier (0 to 1)
      let factor = 1.0;
      const normalizedDist = Math.max(0.001, dist / field.radius);

      if (field.falloff === 'linear') {
        factor = 1.0 - normalizedDist;
      } else if (field.falloff === 'inverse-square') {
        factor = 1.0 / (1.0 + normalizedDist * normalizedDist * 4.0);
      } else if (field.falloff === 'gaussian') {
        factor = Math.exp(-normalizedDist * normalizedDist * 3.0);
      }

      const effectiveStrength = field.strength * factor;

      switch (field.type) {
        case 'gravity':
        case 'attraction': {
          if (dist > 0.05) {
            this.tempVec.normalize().multiplyScalar(effectiveStrength * mass);
            outForce.add(this.tempVec);
          }
          break;
        }

        case 'repulsion': {
          if (dist > 0.05) {
            this.tempVec.normalize().multiplyScalar(-effectiveStrength * mass);
            outForce.add(this.tempVec);
          }
          break;
        }

        case 'vortex': {
          // Cross product of distance vector and upAxis creates a swirling perpendicular force
          this.tangentVec.crossVectors(this.tempVec, this.upAxis).normalize();
          // Pull inward + swirl
          this.tempVec.normalize().multiplyScalar(effectiveStrength * 0.4);
          this.tangentVec.multiplyScalar(effectiveStrength * (field.angularVelocity || 2.0));
          outForce.add(this.tempVec);
          outForce.add(this.tangentVec);
          break;
        }

        case 'turbulence': {
          // Fast procedural 3D sine/cosine curl turbulence
          const fx = Math.sin(point.y * 1.5 + time * 2.0) * Math.cos(point.z * 1.5);
          const fy = Math.sin(point.z * 1.5 + time * 1.8) * Math.cos(point.x * 1.5);
          const fz = Math.sin(point.x * 1.5 + time * 2.2) * Math.cos(point.y * 1.5);
          outForce.x += fx * effectiveStrength;
          outForce.y += fy * effectiveStrength;
          outForce.z += fz * effectiveStrength;
          break;
        }

        case 'wind': {
          if (field.direction) {
            outForce.addScaledVector(field.direction, effectiveStrength * 1.5);
          }
          break;
        }

        case 'drag': {
          outForce.addScaledVector(velocity, -effectiveStrength * 0.5);
          break;
        }

        case 'impulse': {
          if (field.direction) {
            outForce.addScaledVector(field.direction, effectiveStrength * 5.0);
          }
          break;
        }

        case 'orbital': {
          // Pure tangential orbit around center
          this.tangentVec.crossVectors(this.tempVec, this.upAxis).normalize();
          outForce.addScaledVector(this.tangentVec, effectiveStrength * 2.0);
          break;
        }

        case 'magnetic': {
          // Lorentz style force: F = q * (v x B)
          if (field.direction) {
            this.tangentVec.crossVectors(velocity, field.direction).normalize();
            outForce.addScaledVector(this.tangentVec, effectiveStrength * mass);
          }
          break;
        }

        case 'shockwave': {
          // Radial explosive blast outwards
          if (dist > 0.05) {
            this.tempVec.normalize().multiplyScalar(-effectiveStrength * 3.0);
            outForce.add(this.tempVec);
          }
          break;
        }
      }
    }

    return outForce;
  }
}
