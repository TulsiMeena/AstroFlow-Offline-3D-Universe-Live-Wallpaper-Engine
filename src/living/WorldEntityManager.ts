import * as THREE from 'three';
import { QualityConfig } from '../types/engine';
import { EcosystemDNA, LifeEntityType } from './EcosystemDNA';
import { ProceduralLifeGenerator } from './ProceduralLifeGenerator';

export interface LifeEntityInstance {
  id: number;
  type: LifeEntityType;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  target: THREE.Vector3;
  scale: THREE.Vector3;
  wingPhase: number;
  wingSpeed: number;
  energy: number;
  activityTimer: number;
  active: boolean;
}

export class WorldEntityManager {
  private group: THREE.Group;
  private quality: QualityConfig;
  private ecosystemDNA: EcosystemDNA;

  private entityPool: LifeEntityInstance[] = [];
  private instancedMeshes: Map<LifeEntityType, THREE.InstancedMesh> = new Map();
  private entityTypeMap: Map<LifeEntityType, LifeEntityInstance[]> = new Map();

  private dummyMatrix: THREE.Matrix4 = new THREE.Matrix4();
  private dummyPosition: THREE.Vector3 = new THREE.Vector3();
  private dummyRotation: THREE.Euler = new THREE.Euler();
  private dummyScale: THREE.Vector3 = new THREE.Vector3();
  private dummyQuaternion: THREE.Quaternion = new THREE.Quaternion();

  // Spatial boundaries
  private bounds = {
    minX: -18,
    maxX: 18,
    minY: 0.5,
    maxY: 14,
    minZ: -18,
    maxZ: 18
  };

  constructor(quality: QualityConfig, dna: EcosystemDNA) {
    this.group = new THREE.Group();
    this.group.name = 'WorldEntityManagerGroup';
    this.quality = quality;
    this.ecosystemDNA = dna;

    this.initPools();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public setEcosystemDNA(dna: EcosystemDNA) {
    this.ecosystemDNA = dna;
    this.reconfigureActiveCount();
  }

  public setQuality(quality: QualityConfig) {
    this.quality = quality;
    this.initPools();
  }

  /**
   * Returns base instance budget for an entity type based on current graphics quality.
   */
  private getCapacityForType(type: LifeEntityType): number {
    const qMultiplier =
      this.quality.profile === 'LOW'
        ? 0.25
        : this.quality.profile === 'MEDIUM'
        ? 0.5
        : this.quality.profile === 'HIGH'
        ? 0.8
        : 1.0;

    let base = 20;
    switch (type) {
      case 'birds':
        base = 40;
        break;
      case 'butterflies':
        base = 35;
        break;
      case 'fish':
        base = 50;
        break;
      case 'fireflies':
        base = 80;
        break;
      case 'leaves':
        base = 60;
        break;
      case 'clouds':
        base = 12;
        break;
      case 'underwater-creatures':
        base = 14;
        break;
      case 'drones':
        base = 30;
        break;
      case 'volcanic-embers':
        base = 70;
        break;
      case 'insects':
      case 'drifting-spores':
        base = 60;
        break;
      default:
        base = 25;
    }

    const calculated = Math.round(base * qMultiplier * this.ecosystemDNA.entityDensity);
    return Math.max(2, calculated);
  }

  private initPools() {
    // Clean up previous meshes
    while (this.group.children.length > 0) {
      const child = this.group.children[0] as THREE.InstancedMesh;
      this.group.remove(child);
      if (child.geometry) child.geometry.dispose();
    }
    this.instancedMeshes.clear();
    this.entityTypeMap.clear();
    this.entityPool = [];

    const allowedTypes = this.ecosystemDNA.allowedEntities;
    let nextId = 0;

    for (const type of allowedTypes) {
      const capacity = this.getCapacityForType(type);
      const geom = this.getGeometryForType(type);
      const mat = ProceduralLifeGenerator.createEntityMaterial(type);

      const instMesh = new THREE.InstancedMesh(geom, mat, capacity);
      instMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instMesh.frustumCulled = false;
      this.group.add(instMesh);
      this.instancedMeshes.set(type, instMesh);

      const list: LifeEntityInstance[] = [];

      for (let i = 0; i < capacity; i++) {
        const entity: LifeEntityInstance = {
          id: nextId++,
          type,
          position: this.randomInitialPosition(type),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.5
          ),
          target: new THREE.Vector3(),
          scale: new THREE.Vector3(1, 1, 1),
          wingPhase: Math.random() * Math.PI * 2,
          wingSpeed: 4.0 + Math.random() * 8.0,
          energy: 1.0,
          activityTimer: Math.random() * 5.0,
          active: true
        };

        this.pickNewTarget(entity);
        list.push(entity);
        this.entityPool.push(entity);
      }

      this.entityTypeMap.set(type, list);
    }
  }

  private getGeometryForType(type: LifeEntityType): THREE.BufferGeometry {
    switch (type) {
      case 'birds':
        return ProceduralLifeGenerator.createBirdGeometry();
      case 'butterflies':
        return ProceduralLifeGenerator.createButterflyGeometry();
      case 'fish':
        return ProceduralLifeGenerator.createFishGeometry();
      case 'fireflies':
        return ProceduralLifeGenerator.createInsectGeometry();
      case 'leaves':
        return ProceduralLifeGenerator.createLeafGeometry();
      case 'clouds':
        return ProceduralLifeGenerator.createCloudGeometry();
      case 'underwater-creatures':
        return ProceduralLifeGenerator.createUnderwaterCreatureGeometry();
      case 'drones':
      case 'light-traffic':
        return ProceduralLifeGenerator.createCyberDroneGeometry();
      case 'volcanic-embers':
        return ProceduralLifeGenerator.createEmberGeometry();
      case 'insects':
      case 'drifting-spores':
      default:
        return ProceduralLifeGenerator.createInsectGeometry();
    }
  }

  private randomInitialPosition(type: LifeEntityType): THREE.Vector3 {
    let yMin = 1.0;
    let yMax = 8.0;

    if (type === 'fish' || type === 'underwater-creatures') {
      yMin = -4.0;
      yMax = 0.5;
    } else if (type === 'clouds') {
      yMin = 9.0;
      yMax = 16.0;
    } else if (type === 'fireflies' || type === 'butterflies') {
      yMin = 0.6;
      yMax = 3.5;
    } else if (type === 'birds') {
      yMin = 3.0;
      yMax = 12.0;
    } else if (type === 'volcanic-embers') {
      yMin = 0.5;
      yMax = 7.0;
    }

    return new THREE.Vector3(
      (Math.random() - 0.5) * 28,
      yMin + Math.random() * (yMax - yMin),
      (Math.random() - 0.5) * 28
    );
  }

  private pickNewTarget(entity: LifeEntityInstance) {
    const p = entity.position;
    entity.target.set(
      p.x + (Math.random() - 0.5) * 12,
      THREE.MathUtils.clamp(p.y + (Math.random() - 0.5) * 4, this.bounds.minY, this.bounds.maxY),
      p.z + (Math.random() - 0.5) * 12
    );

    // Keep targets inside bounding bounds
    entity.target.x = THREE.MathUtils.clamp(entity.target.x, this.bounds.minX, this.bounds.maxX);
    entity.target.z = THREE.MathUtils.clamp(entity.target.z, this.bounds.minZ, this.bounds.maxZ);
  }

  public getEntities(): LifeEntityInstance[] {
    return this.entityPool;
  }

  public getEntitiesByType(type: LifeEntityType): LifeEntityInstance[] {
    return this.entityTypeMap.get(type) || [];
  }

  public reconfigureActiveCount() {
    for (const [type, list] of this.entityTypeMap.entries()) {
      const instMesh = this.instancedMeshes.get(type);
      if (!instMesh) continue;

      const activeRatio = THREE.MathUtils.clamp(this.ecosystemDNA.entityDensity, 0.1, 1.0);
      const activeCount = Math.floor(list.length * activeRatio);

      for (let i = 0; i < list.length; i++) {
        list[i].active = i < activeCount;
      }
    }
  }

  /**
   * Synchronizes entity state to Three.js InstancedMesh buffers.
   */
  public commitToMeshes() {
    for (const [type, list] of this.entityTypeMap.entries()) {
      const instMesh = this.instancedMeshes.get(type);
      if (!instMesh) continue;

      for (let i = 0; i < list.length; i++) {
        const ent = list[i];
        if (!ent.active) {
          this.dummyMatrix.makeScale(0, 0, 0);
          instMesh.setMatrixAt(i, this.dummyMatrix);
          continue;
        }

        this.dummyPosition.copy(ent.position);

        // Flapping / flutter oscillation
        let baseScale = 1.0;
        if (ent.type === 'butterflies') {
          baseScale = 0.8 + Math.sin(ent.wingPhase) * 0.15;
        } else if (ent.type === 'clouds') {
          baseScale = 2.0;
        } else if (ent.type === 'volcanic-embers') {
          baseScale = 0.6 + Math.sin(ent.wingPhase * 2) * 0.2;
        } else if (ent.type === 'fireflies') {
          baseScale = 0.5 + Math.sin(ent.wingPhase * 1.5) * 0.25;
        }

        this.dummyScale.set(baseScale, baseScale, baseScale);

        // Orient facing movement velocity
        if (ent.velocity.lengthSq() > 0.0001) {
          this.dummyRotation.y = Math.atan2(ent.velocity.x, ent.velocity.z);
          this.dummyRotation.x = -Math.atan2(ent.velocity.y, Math.sqrt(ent.velocity.x * ent.velocity.x + ent.velocity.z * ent.velocity.z));
          this.dummyRotation.z = -ent.velocity.x * 0.4; // banking tilt
          this.dummyQuaternion.setFromEuler(this.dummyRotation);
        }

        this.dummyMatrix.compose(this.dummyPosition, this.dummyQuaternion, this.dummyScale);
        instMesh.setMatrixAt(i, this.dummyMatrix);
      }

      instMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public dispose() {
    for (const mesh of this.instancedMeshes.values()) {
      this.group.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    }
    this.instancedMeshes.clear();
    this.entityTypeMap.clear();
    this.entityPool = [];
  }
}
