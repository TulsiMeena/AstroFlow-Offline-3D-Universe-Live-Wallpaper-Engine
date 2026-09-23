import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';

export class CosmicParticleFieldWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'cosmic-particle-field',
    title: 'Cosmic Particle Field',
    subtitle: 'Deep Space Quantum Nebulae',
    category: 'Cosmic',
    description: 'A procedural swirling field of cosmic dust particles interacting with phone motion, multi-depth parallax, gravitational nodes, and energy shockwaves.',
    author: 'Amit Meena',
    tags: ['Cosmic', 'Particles', '3D', 'Deep Space', 'Motion Parallax'],
    accentColor: '#00F0FF',
    secondaryColor: '#7000FF',
    interactive: true,
    proceduralType: 'particles'
  };

  private particles: THREE.Points | null = null;
  private particleCount: number = 6000;
  private positions: Float32Array = new Float32Array(0);
  private velocities: Float32Array = new Float32Array(0);
  private originalPositions: Float32Array = new Float32Array(0);
  private colors: Float32Array = new Float32Array(0);
  private coreSphere: THREE.Mesh | null = null;

  protected buildScene(): void {
    if (!this.quality) return;
    this.particleCount = Math.min(8000, this.quality.maxParticleCount);

    const count = this.particleCount;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.originalPositions = new Float32Array(count * 3);
    this.colors = new Float32Array(count * 3);

    const colorCyan = new THREE.Color(0x00f0ff);
    const colorPurple = new THREE.Color(0x8a2be2);
    const colorPink = new THREE.Color(0xff007f);
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Spiral stream distribution
      const branchAngle = ((i % 5) * (2 * Math.PI)) / 5;
      const radius = Math.pow(Math.random(), 1.5) * 8 + 0.5;
      const spinAngle = radius * 0.8;

      const randomX = (Math.random() - 0.5) * 1.5;
      const randomY = (Math.random() - 0.5) * 1.5;
      const randomZ = (Math.random() - 0.5) * 1.5;

      const x = Math.cos(branchAngle + spinAngle) * radius + randomX;
      const y = (Math.random() - 0.5) * 3 + randomY;
      const z = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      this.positions[i3] = x;
      this.positions[i3 + 1] = y;
      this.positions[i3 + 2] = z;

      this.originalPositions[i3] = x;
      this.originalPositions[i3 + 1] = y;
      this.originalPositions[i3 + 2] = z;

      this.velocities[i3] = 0;
      this.velocities[i3 + 1] = 0;
      this.velocities[i3 + 2] = 0;

      // Distance-based color blending
      const distRatio = Math.min(1, radius / 8);
      if (distRatio < 0.3) {
        tempColor.copy(colorPink).lerp(colorPurple, distRatio / 0.3);
      } else {
        tempColor.copy(colorPurple).lerp(colorCyan, (distRatio - 0.3) / 0.7);
      }

      this.colors[i3] = tempColor.r;
      this.colors[i3 + 1] = tempColor.g;
      this.colors[i3 + 2] = tempColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    // Procedural glowing particle canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.2, 'rgba(0,240,255,0.9)');
      grad.addColorStop(0.6, 'rgba(112,0,255,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.rootGroup.add(this.particles);

    // Glowing core star
    const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    this.coreSphere = new THREE.Mesh(coreGeo, coreMat);
    this.rootGroup.add(this.coreSphere);
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (!this.particles || !this.particles.geometry) return;

    const time = ctx.time * 0.4;
    const delta = ctx.delta;

    // Cinematic tilt perspective from phone orientation + pointer
    const tiltX = ctx.motion.tiltX;
    const tiltY = ctx.motion.tiltY;

    this.rootGroup.rotation.y = time * 0.2 + tiltX * 0.45;
    this.rootGroup.rotation.x = Math.sin(time * 0.15) * 0.1 - tiltY * 0.35;

    // Energy & Audio reaction on core star
    if (this.coreSphere) {
      const audioPulse = ctx.audioTargets ? ctx.audioTargets.galaxyPulse * 0.5 : 0;
      const audioScale = ctx.audioTargets ? ctx.audioTargets.particleScale : 1.0;
      const energyPulse = ctx.energyReaction.brightness;
      const pulse = ((1.0 + Math.sin(time * 3.0) * 0.15) * energyPulse + audioPulse) * audioScale;
      this.coreSphere.scale.set(pulse, pulse, pulse);
      this.coreSphere.rotation.y = -time * 0.8;
      this.coreSphere.rotation.z = time * 0.5;
    }

    const posAttr = this.particles.geometry.attributes.position as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;

    // Apply Universal Interaction Field (attraction, ripple, impulse, vortex)
    if (ctx.interactionField && ctx.interactionField.active) {
      ctx.interactionField.applyToParticles(pos, this.velocities, this.particleCount, delta);
    }

    // Motion event reaction: phone shake creates a cosmic dispersion wave
    if (ctx.motion.lastMotionEvent === 'SHAKE' || (ctx.audioTargets && ctx.audioTargets.shockwaveTrigger)) {
      const mult = ctx.motion.lastMotionEvent === 'SHAKE' ? 8.0 : 4.0;
      for (let i = 0; i < this.particleCount; i++) {
        const i3 = i * 3;
        this.velocities[i3] += (Math.random() - 0.5) * mult;
        this.velocities[i3 + 1] += (Math.random() - 0.5) * mult;
        this.velocities[i3 + 2] += (Math.random() - 0.5) * mult;
      }
    }

    // Update positions with velocities + gentle elastic return to original orbital stream
    const returnSpeed = delta * 1.5;
    const drag = 0.94;

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Apply drag
      this.velocities[i3] *= drag;
      this.velocities[i3 + 1] *= drag;
      this.velocities[i3 + 2] *= drag;

      // Apply velocity displacement
      pos[i3] += this.velocities[i3] * delta * 60;
      pos[i3 + 1] += this.velocities[i3 + 1] * delta * 60;
      pos[i3 + 2] += this.velocities[i3 + 2] * delta * 60;

      // Elastic return to spiral trajectory
      const ox = this.originalPositions[i3];
      const oy = this.originalPositions[i3 + 1];
      const oz = this.originalPositions[i3 + 2];
      const wave = Math.sin(time + ox * 0.5 + oz * 0.5) * 0.3;

      pos[i3] += (ox - pos[i3]) * returnSpeed;
      pos[i3 + 1] += (oy + wave - pos[i3 + 1]) * returnSpeed;
      pos[i3 + 2] += (oz - pos[i3 + 2]) * returnSpeed;
    }

    posAttr.needsUpdate = true;
  }
}
