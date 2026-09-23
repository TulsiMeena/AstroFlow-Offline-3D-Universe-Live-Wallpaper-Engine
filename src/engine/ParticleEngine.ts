import * as THREE from 'three';
import { QualityConfig } from '../types/engine';
import { InteractionField } from './physics/InteractionField';
import { RippleField } from './physics/RippleField';
import { GravityManager } from './physics/GravityManager';

export interface ParticleEmitterOptions {
  maxParticles?: number;
  size?: number;
  colorStart?: number;
  colorEnd?: number;
  speed?: number;
  radius?: number;
  spread?: number;
  gravity?: number;
  drag?: number;
  boundaryMode?: 'wrap' | 'bounce' | 'respawn';
}

export class ParticleEngine {
  private particles: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;

  // Typed arrays for particle simulation
  private positions: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);
  private accelerations: Float32Array = new Float32Array(0);
  private colors: Float32Array = new Float32Array(0);
  private baseColors: Float32Array = new Float32Array(0);
  private lifetimes: Float32Array = new Float32Array(0);

  private particleCount: number = 0;
  private maxAllowedParticles: number = 5000;
  private options: Required<ParticleEmitterOptions>;
  private originalSize: number = 0.05;

  constructor(options: ParticleEmitterOptions = {}) {
    this.options = {
      maxParticles: options.maxParticles || 3000,
      size: options.size || 0.05,
      colorStart: options.colorStart || 0x00f0ff,
      colorEnd: options.colorEnd || 0x7000ff,
      speed: options.speed || 1.0,
      radius: options.radius || 4.0,
      spread: options.spread || 2.0,
      gravity: options.gravity || 0.0,
      drag: options.drag || 0.985,
      boundaryMode: options.boundaryMode || 'wrap'
    };
    this.originalSize = this.options.size;
  }

  public init(scene: THREE.Scene, quality: QualityConfig) {
    this.dispose();

    // Bound count strictly based on quality profile to prevent mobile GPU throttling
    this.maxAllowedParticles = Math.min(this.options.maxParticles, quality.maxParticleCount);
    this.particleCount = this.maxAllowedParticles;

    this.positions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    this.accelerations = new Float32Array(this.particleCount * 3);
    this.colors = new Float32Array(this.particleCount * 3);
    this.baseColors = new Float32Array(this.particleCount * 3);
    this.lifetimes = new Float32Array(this.particleCount);

    const color1 = new THREE.Color(this.options.colorStart);
    const color2 = new THREE.Color(this.options.colorEnd);
    const tempColor = new THREE.Color();

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      // Spherical distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = Math.cbrt(Math.random()) * this.options.radius;

      this.positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      this.positions[i3 + 2] = r * Math.cos(phi);

      this.velocities[i3] = (Math.random() - 0.5) * 0.2 * this.options.speed;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.2 * this.options.speed;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.2 * this.options.speed;

      const alpha = Math.random();
      tempColor.copy(color1).lerp(color2, alpha);
      this.colors[i3] = tempColor.r;
      this.colors[i3 + 1] = tempColor.g;
      this.colors[i3 + 2] = tempColor.b;

      this.baseColors[i3] = tempColor.r;
      this.baseColors[i3 + 1] = tempColor.g;
      this.baseColors[i3 + 2] = tempColor.b;

      this.lifetimes[i] = Math.random();
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Create custom particle sprite canvas texture procedurally without internet
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 32;
    spriteCanvas.height = 32;
    const ctx = spriteCanvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(0.3, 'rgba(100,220,255,0.8)');
      gradient.addColorStop(0.7, 'rgba(0,100,255,0.3)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(spriteCanvas);

    this.material = new THREE.PointsMaterial({
      size: this.options.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(this.geometry, this.material);
    scene.add(this.particles);
  }

  public applyInteractionField(field: InteractionField, delta: number) {
    if (!this.geometry) return;
    field.applyToParticles(this.positions, this.velocities, this.particleCount, delta);
  }

  public applyGravityManager(gravity: GravityManager, delta: number) {
    if (!this.geometry) return;
    gravity.applyToParticles(this.positions, this.velocities, this.particleCount, delta, this.options.drag);
  }

  public applyRippleField(field: RippleField, time: number) {
    if (!this.geometry) return;
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const sample = field.sampleHeightAndNormal(this.positions[i3], this.positions[i3 + 1], time);
      if (Math.abs(sample.height) > 0.01) {
        this.velocities[i3] += sample.nx * 0.15;
        this.velocities[i3 + 1] += sample.ny * 0.15;
        this.positions[i3 + 2] += sample.height * 0.2;
      }
    }
  }

  public brighten(multiplier: number) {
    if (!this.material || !this.geometry) return;
    this.material.size = this.originalSize * Math.min(2.0, multiplier);
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;
    const cols = colAttr.array as Float32Array;

    for (let i = 0; i < this.particleCount * 3; i++) {
      cols[i] = Math.min(1.0, this.baseColors[i] * multiplier);
    }
    colAttr.needsUpdate = true;
  }

  public burst(x: number, y: number, z: number, count: number = 80, speed: number = 3.0) {
    const burstCount = Math.min(count, this.particleCount);
    for (let i = 0; i < burstCount; i++) {
      const idx = Math.floor(Math.random() * this.particleCount) * 3;
      this.positions[idx] = x + (Math.random() - 0.5) * 0.2;
      this.positions[idx + 1] = y + (Math.random() - 0.5) * 0.2;
      this.positions[idx + 2] = z + (Math.random() - 0.5) * 0.2;

      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const spd = (0.5 + Math.random() * 0.5) * speed;

      this.velocities[idx] = Math.cos(angle) * Math.cos(elevation) * spd;
      this.velocities[idx + 1] = Math.sin(elevation) * spd;
      this.velocities[idx + 2] = Math.sin(angle) * Math.cos(elevation) * spd;
    }
  }

  public update(delta: number, flowVector?: THREE.Vector3) {
    if (!this.geometry || !this.particles) return;

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const r = this.options.radius;
    const rSq = r * r;
    const drag = this.options.drag;
    const grav = this.options.gravity;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Apply drag
      this.velocities[i3] *= drag;
      this.velocities[i3 + 1] = (this.velocities[i3 + 1] - grav * delta) * drag;
      this.velocities[i3 + 2] *= drag;

      // Apply velocity
      pos[i3] += this.velocities[i3] * delta * 60;
      pos[i3 + 1] += this.velocities[i3 + 1] * delta * 60;
      pos[i3 + 2] += this.velocities[i3 + 2] * delta * 60;

      if (flowVector) {
        pos[i3] += flowVector.x * delta * 2;
        pos[i3 + 1] += flowVector.y * delta * 2;
        pos[i3 + 2] += flowVector.z * delta * 2;
      }

      // Boundary handling
      const distSq = pos[i3] * pos[i3] + pos[i3 + 1] * pos[i3 + 1] + pos[i3 + 2] * pos[i3 + 2];
      if (distSq > rSq) {
        if (this.options.boundaryMode === 'wrap') {
          const factor = 0.25;
          pos[i3] = (Math.random() - 0.5) * r * factor;
          pos[i3 + 1] = (Math.random() - 0.5) * r * factor;
          pos[i3 + 2] = (Math.random() - 0.5) * r * factor;
        } else if (this.options.boundaryMode === 'bounce') {
          this.velocities[i3] *= -0.8;
          this.velocities[i3 + 1] *= -0.8;
          this.velocities[i3 + 2] *= -0.8;
        }
      }
    }

    posAttr.needsUpdate = true;
  }

  public getParticleCount(): number {
    return this.particleCount;
  }

  public getPositions(): Float32Array {
    return this.positions;
  }

  public getVelocities(): Float32Array {
    return this.velocities;
  }

  public dispose() {
    if (this.particles) {
      if (this.particles.parent) {
        this.particles.parent.remove(this.particles);
      }
      this.particles = null;
    }
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      if (this.material.map) this.material.map.dispose();
      this.material.dispose();
      this.material = null;
    }
  }
}
