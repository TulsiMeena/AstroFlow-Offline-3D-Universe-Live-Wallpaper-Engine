import * as THREE from 'three';
import { QualityConfig, MotionData } from '../types/engine';
import { FluidSimulationType } from './types';

export class FluidReactionSystem {
  private group: THREE.Group;
  private mode: FluidSimulationType = 'water';
  private resolution: number = 48; // grid width/height
  private size: number = 18; // world size
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.PlaneGeometry | null = null;
  private material: THREE.MeshStandardMaterial | null = null;

  // Wave height & velocity buffers
  private heightBufferA: Float32Array;
  private heightBufferB: Float32Array;
  private velocityBuffer: Float32Array;
  private currentBuffer: number = 0;

  // Physics properties
  private damping: number = 0.985;
  private waveSpeed: number = 4.0;
  private sloshTilt: THREE.Vector2 = new THREE.Vector2();

  constructor(quality: QualityConfig, mode: FluidSimulationType = 'water') {
    this.group = new THREE.Group();
    this.group.name = 'FluidReactionSystem_Group';
    this.mode = mode;

    if (quality.profile === 'LOW') this.resolution = 28;
    else if (quality.profile === 'MEDIUM') this.resolution = 40;
    else if (quality.profile === 'HIGH') this.resolution = 52;
    else this.resolution = 64;

    const totalVertices = this.resolution * this.resolution;
    this.heightBufferA = new Float32Array(totalVertices);
    this.heightBufferB = new Float32Array(totalVertices);
    this.velocityBuffer = new Float32Array(totalVertices);

    this.initFluidSurface();
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  public getMode(): FluidSimulationType {
    return this.mode;
  }

  public setMode(mode: FluidSimulationType): void {
    this.mode = mode;
    this.updateMaterialStyle();
  }

  private initFluidSurface(): void {
    this.geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.resolution - 1,
      this.resolution - 1
    );
    this.geometry.rotateX(-Math.PI / 2);

    this.material = new THREE.MeshStandardMaterial({
      color: 0x0088cc,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });

    this.updateMaterialStyle();

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, -3.5, 0);
    this.group.add(this.mesh);
  }

  private updateMaterialStyle(): void {
    if (!this.material) return;

    switch (this.mode) {
      case 'water':
        this.material.color.setHex(0x0088dd);
        this.material.roughness = 0.08;
        this.material.metalness = 0.3;
        this.material.opacity = 0.85;
        this.damping = 0.985;
        break;

      case 'liquid-glass':
        this.material.color.setHex(0xd0f4de);
        this.material.roughness = 0.02;
        this.material.metalness = 0.9;
        this.material.opacity = 0.7;
        this.damping = 0.99;
        break;

      case 'plasma':
        this.material.color.setHex(0x9d4edd);
        this.material.roughness = 0.2;
        this.material.metalness = 0.5;
        this.material.opacity = 0.9;
        this.damping = 0.975;
        break;

      case 'lava':
        this.material.color.setHex(0xff3c00);
        this.material.roughness = 0.65;
        this.material.metalness = 0.2;
        this.material.opacity = 0.95;
        this.damping = 0.94; // higher viscosity
        break;

      case 'smoke':
        this.material.color.setHex(0x6c757d);
        this.material.roughness = 0.8;
        this.material.metalness = 0.1;
        this.material.opacity = 0.6;
        this.damping = 0.96;
        break;

      case 'energy':
        this.material.color.setHex(0x00f0ff);
        this.material.roughness = 0.1;
        this.material.metalness = 0.8;
        this.material.opacity = 0.92;
        this.damping = 0.98;
        break;
    }
  }

  /**
   * Add a local disturbance (ripple, splash, or drop) at world coordinate (x, z)
   */
  public addDisturbance(worldX: number, worldZ: number, strength: number, radius: number = 1.2): void {
    // Convert world coords to grid coords
    const halfSize = this.size * 0.5;
    const gridX = ((worldX + halfSize) / this.size) * (this.resolution - 1);
    const gridZ = ((worldZ + halfSize) / this.size) * (this.resolution - 1);

    const radGrid = (radius / this.size) * (this.resolution - 1);
    const radInt = Math.ceil(radGrid);

    const current = this.currentBuffer === 0 ? this.heightBufferA : this.heightBufferB;

    const minX = Math.max(1, Math.floor(gridX - radInt));
    const maxX = Math.min(this.resolution - 2, Math.ceil(gridX + radInt));
    const minZ = Math.max(1, Math.floor(gridZ - radInt));
    const maxZ = Math.min(this.resolution - 2, Math.ceil(gridZ + radInt));

    for (let z = minZ; z <= maxZ; z++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - gridX;
        const dz = z - gridZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= radGrid) {
          const falloff = 1.0 - dist / radGrid;
          const idx = z * this.resolution + x;
          current[idx] += strength * falloff;
        }
      }
    }
  }

  /**
   * Add a swirling vortex depression into the fluid
   */
  public addVortex(worldX: number, worldZ: number, strength: number, radius: number = 2.5): void {
    this.addDisturbance(worldX, worldZ, -strength * 1.5, radius);
  }

  public update(delta: number, time: number, motion?: MotionData): void {
    if (!this.geometry) return;

    // Handle motion tilt sloshing
    if (motion) {
      const roll = motion.roll ?? motion.tiltX ?? 0;
      const pitch = motion.pitch ?? motion.tiltY ?? 0;
      const targetSloshX = roll * 0.4;
      const targetSloshZ = pitch * 0.4;
      this.sloshTilt.x += (targetSloshX - this.sloshTilt.x) * Math.min(1.0, delta * 3.0);
      this.sloshTilt.y += (targetSloshZ - this.sloshTilt.y) * Math.min(1.0, delta * 3.0);
    }

    const current = this.currentBuffer === 0 ? this.heightBufferA : this.heightBufferB;
    const next = this.currentBuffer === 0 ? this.heightBufferB : this.heightBufferA;

    const res = this.resolution;
    const dt = Math.min(delta, 0.05);

    // Wave equation propagation:
    // d^2h/dt^2 = c^2 * laplacian(h)
    for (let z = 1; z < res - 1; z++) {
      for (let x = 1; x < res - 1; x++) {
        const idx = z * res + x;
        const up = (z - 1) * res + x;
        const down = (z + 1) * res + x;
        const left = z * res + (x - 1);
        const right = z * res + (x + 1);

        const laplacian =
          (current[up] + current[down] + current[left] + current[right]) * 0.25 - current[idx];

        this.velocityBuffer[idx] += laplacian * this.waveSpeed * dt * 30.0;
        this.velocityBuffer[idx] *= this.damping;

        next[idx] = current[idx] + this.velocityBuffer[idx];
      }
    }

    this.currentBuffer = 1 - this.currentBuffer;

    // Update Three.js PlaneGeometry positions
    const posAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;

    for (let i = 0; i < res * res; i++) {
      const idxY = i * 3 + 1; // Y axis is height since plane was rotated
      const xNorm = (i % res) / res - 0.5;
      const zNorm = Math.floor(i / res) / res - 0.5;

      // Combine wave height with phone tilt slosh
      const slosh = xNorm * this.sloshTilt.x * 2.0 + zNorm * this.sloshTilt.y * 2.0;
      posArray[idxY] = next[i] + slosh;
    }

    posAttr.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}
