import * as THREE from 'three';
import { QualityConfig, MotionData } from '../types/engine';
import { GravitySystem } from './GravitySystem';
import { WindSystem } from './WindSystem';
import { ForceFieldManager } from './ForceFieldManager';
import { ShockwaveSystem } from './ShockwaveSystem';

interface RibbonNode {
  position: THREE.Vector3;
  oldPosition: THREE.Vector3;
  acceleration: THREE.Vector3;
  isPinned: boolean;
}

interface Ribbon {
  nodes: RibbonNode[];
  segmentLength: number;
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  color: THREE.Color;
}

export class ClothRibbonReactionSystem {
  private group: THREE.Group;
  private ribbons: Ribbon[] = [];
  private ribbonCount: number = 6;
  private nodesPerRibbon: number = 24;
  private segmentLength: number = 0.45;
  private tempVec: THREE.Vector3 = new THREE.Vector3();
  private tempForce: THREE.Vector3 = new THREE.Vector3();
  private tempGravity: THREE.Vector3 = new THREE.Vector3();
  private tempWind: THREE.Vector3 = new THREE.Vector3();
  private tempShock: THREE.Vector3 = new THREE.Vector3();

  constructor(quality: QualityConfig) {
    this.group = new THREE.Group();
    this.group.name = 'ClothRibbonReactionSystem_Group';

    if (quality.profile === 'LOW') {
      this.ribbonCount = 3;
      this.nodesPerRibbon = 16;
    } else if (quality.profile === 'MEDIUM') {
      this.ribbonCount = 5;
      this.nodesPerRibbon = 20;
    } else if (quality.profile === 'HIGH') {
      this.ribbonCount = 7;
      this.nodesPerRibbon = 26;
    } else {
      this.ribbonCount = 9;
      this.nodesPerRibbon = 32;
    }

    this.initRibbons();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getNodeCount(): number {
    return this.ribbons.reduce((sum, r) => sum + r.nodes.length, 0);
  }

  private initRibbons(): void {
    const palette = [
      0x00f0ff, // neon cyan
      0xd946ef, // hot magenta
      0x7000ff, // royal violet
      0x00ff88, // emerald
      0xffb703, // solar gold
      0x4cc9f0, // electric blue
      0xf72585, // vivid pink
    ];

    for (let r = 0; r < this.ribbonCount; r++) {
      const nodes: RibbonNode[] = [];
      const startX = (r - (this.ribbonCount - 1) * 0.5) * 2.8;
      const startY = 5.5 + Math.sin(r) * 0.5;
      const startZ = (Math.random() - 0.5) * 3.0;

      for (let n = 0; n < this.nodesPerRibbon; n++) {
        const pos = new THREE.Vector3(startX, startY - n * this.segmentLength, startZ);
        nodes.push({
          position: pos.clone(),
          oldPosition: pos.clone(),
          acceleration: new THREE.Vector3(),
          isPinned: n === 0, // Top node anchored
        });
      }

      // Procedural strip mesh geometry (2 vertices per node for ribbon width)
      const vertexCount = this.nodesPerRibbon * 2;
      const positions = new Float32Array(vertexCount * 3);
      const uvs = new Float32Array(vertexCount * 2);
      const indices: number[] = [];

      for (let n = 0; n < this.nodesPerRibbon - 1; n++) {
        const topL = n * 2;
        const topR = n * 2 + 1;
        const btmL = (n + 1) * 2;
        const btmR = (n + 1) * 2 + 1;
        indices.push(topL, btmL, topR);
        indices.push(topR, btmL, btmR);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(indices);

      const color = new THREE.Color(palette[r % palette.length]);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.25,
        metalness: 0.6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
      });

      const mesh = new THREE.Mesh(geo, mat);
      this.group.add(mesh);

      this.ribbons.push({
        nodes,
        segmentLength: this.segmentLength,
        mesh,
        geometry: geo,
        color,
      });
    }
  }

  public update(
    delta: number,
    time: number,
    gravity: GravitySystem,
    wind: WindSystem,
    forces: ForceFieldManager,
    shockwaves: ShockwaveSystem,
    motion?: MotionData
  ): void {
    const dt = Math.min(delta, 0.033);
    const damping = 0.96; // air drag on cloth nodes

    for (const ribbon of this.ribbons) {
      // 1. Verlet Integration Step
      for (const node of ribbon.nodes) {
        if (node.isPinned) {
          // Anchored top node gently breathes or reacts to phone motion
          if (motion) {
            const roll = motion.roll ?? motion.tiltX ?? 0;
            const pitch = motion.pitch ?? motion.tiltY ?? 0;
            node.position.x += roll * delta * 0.5;
            node.position.z += pitch * delta * 0.5;
          }
          continue;
        }

        // Calculate forces
        gravity.getGravityAt(node.position, this.tempGravity);
        wind.getWindAt(node.position, time, this.tempWind);
        shockwaves.applyShockwaveForce(node.position, this.tempVec, this.tempShock);

        this.tempVec.subVectors(node.position, node.oldPosition).multiplyScalar(1 / Math.max(0.001, dt));
        forces.calculateAccumulatedForce(
          node.position,
          this.tempVec,
          0.5,
          this.tempForce,
          time
        );

        node.acceleration.set(0, 0, 0);
        node.acceleration.add(this.tempGravity);
        node.acceleration.add(this.tempWind);
        node.acceleration.add(this.tempShock);
        node.acceleration.add(this.tempForce);

        // Verlet: pos_next = pos + (pos - oldPos) * damping + acc * dt^2
        const vx = (node.position.x - node.oldPosition.x) * damping;
        const vy = (node.position.y - node.oldPosition.y) * damping;
        const vz = (node.position.z - node.oldPosition.z) * damping;

        node.oldPosition.copy(node.position);

        node.position.x += vx + node.acceleration.x * dt * dt;
        node.position.y += vy + node.acceleration.y * dt * dt;
        node.position.z += vz + node.acceleration.z * dt * dt;
      }

      // 2. Distance Constraint Relaxation (2 iterations for stability)
      for (let iter = 0; iter < 2; iter++) {
        for (let i = 0; i < ribbon.nodes.length - 1; i++) {
          const n1 = ribbon.nodes[i];
          const n2 = ribbon.nodes[i + 1];

          this.tempVec.subVectors(n2.position, n1.position);
          const dist = this.tempVec.length();
          if (dist > 0.0001) {
            const diff = (dist - ribbon.segmentLength) / dist;
            if (!n1.isPinned) {
              n1.position.addScaledVector(this.tempVec, diff * 0.5);
            }
            if (!n2.isPinned) {
              n2.position.addScaledVector(this.tempVec, -diff * 0.5);
            }
          }
        }
      }

      // 3. Update Ribbon Mesh Strip Vertices
      const posAttr = ribbon.geometry.getAttribute('position') as THREE.BufferAttribute;
      const posArr = posAttr.array as Float32Array;
      const ribbonWidth = 0.25;

      for (let i = 0; i < ribbon.nodes.length; i++) {
        const node = ribbon.nodes[i];
        let tangent: THREE.Vector3;
        if (i < ribbon.nodes.length - 1) {
          tangent = new THREE.Vector3().subVectors(ribbon.nodes[i + 1].position, node.position).normalize();
        } else {
          tangent = new THREE.Vector3().subVectors(node.position, ribbon.nodes[i - 1].position).normalize();
        }

        // Perpendicular vector across width
        const binormal = new THREE.Vector3(0, 0, 1).cross(tangent).normalize().multiplyScalar(ribbonWidth);

        const vL = i * 2 * 3;
        const vR = (i * 2 + 1) * 3;

        posArr[vL] = node.position.x - binormal.x;
        posArr[vL + 1] = node.position.y - binormal.y;
        posArr[vL + 2] = node.position.z - binormal.z;

        posArr[vR] = node.position.x + binormal.x;
        posArr[vR + 1] = node.position.y + binormal.y;
        posArr[vR + 2] = node.position.z + binormal.z;
      }

      posAttr.needsUpdate = true;
      ribbon.geometry.computeVertexNormals();
    }
  }
}
