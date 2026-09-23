import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';

export class LiquidRippleWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'liquid-ripple',
    title: 'Liquid Ripple',
    subtitle: 'Prismatic Fluid Waves',
    category: 'Nature',
    description: 'Real-time procedural fluid simulation with harmonic vertex waves, physical phone tilt surface perspective, and touch-reactive propagating ripples.',
    author: 'Amit Meena',
    tags: ['Water', 'Fluid', 'Wave', 'Motion Physics', 'Interactive'],
    accentColor: '#00D2FF',
    secondaryColor: '#0047FF',
    interactive: true,
    proceduralType: 'fluid'
  };

  private mesh: THREE.Mesh | null = null;
  private wireMesh: THREE.Mesh | null = null;
  private segments: number = 64;
  private turbulenceEnergy: number = 0;

  protected buildScene(): void {
    if (this.quality) {
      this.segments = this.quality.profile === 'LOW' ? 36 : this.quality.profile === 'MEDIUM' ? 52 : 72;
    }

    const geometry = new THREE.PlaneGeometry(12, 12, this.segments, this.segments);

    // Dynamic wave material with procedural colors
    const material = new THREE.MeshPhongMaterial({
      color: 0x0a2240,
      emissive: 0x021020,
      specular: 0x00f0ff,
      shininess: 95,
      flatShading: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2.4;
    this.mesh.position.y = -0.6;
    this.mesh.receiveShadow = true;
    this.rootGroup.add(this.mesh);

    // Neon wireframe overlay on high settings
    if (this.quality && this.quality.profile !== 'LOW') {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18
      });
      this.wireMesh = new THREE.Mesh(geometry, wireMat);
      this.wireMesh.rotation.x = this.mesh.rotation.x;
      this.wireMesh.position.y = this.mesh.position.y + 0.01;
      this.rootGroup.add(this.wireMesh);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (!this.mesh) return;

    const time = ctx.time * 1.4;
    const delta = ctx.delta;
    const geometry = this.mesh.geometry as THREE.PlaneGeometry;
    const position = geometry.attributes.position as THREE.BufferAttribute;

    // Phone tilt perspective influences water angle
    const tiltX = ctx.motion.tiltX;
    const tiltY = ctx.motion.tiltY;
    this.mesh.rotation.z = tiltX * 0.18;
    this.mesh.rotation.x = -Math.PI / 2.4 - tiltY * 0.15;

    // Motion event reaction: phone shake produces turbulent storm waves
    if (ctx.motion.lastMotionEvent === 'SHAKE') {
      this.turbulenceEnergy = 1.0;
    }
    if (this.turbulenceEnergy > 0.01) {
      this.turbulenceEnergy *= Math.pow(0.5, delta);
    } else {
      this.turbulenceEnergy = 0;
    }

    // Touch interactions generate ripples in the RippleField
    if (ctx.input.isDown) {
      const wx = ctx.input.x * 5.0;
      const wy = ctx.input.y * 5.0;
      ctx.rippleField.spawnRipple(wx, wy, 0.6, 4.0, 6.0);
    }

    const audioAmp = ctx.audioTargets ? ctx.audioTargets.waveAmplitude : 1.0;

    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i);
      const v = position.getY(i);

      // Multi-frequency harmonic ambient water waves modulated by audio amplitude
      const wave1 = Math.sin(u * 1.4 + time) * 0.22 * audioAmp;
      const wave2 = Math.cos(v * 1.6 + time * 1.2) * 0.18 * audioAmp;
      const wave3 = Math.sin(Math.sqrt(u * u + v * v) * 2.2 - time * 1.8) * 0.12 * audioAmp;

      // Sample RippleField dynamic propagating waves
      const ripSample = ctx.rippleField.sampleHeightAndNormal(u, v, ctx.time);

      // Turbulent storm wave if phone was shaken
      const storm = this.turbulenceEnergy > 0
        ? Math.sin(u * 4.0 + time * 8.0) * Math.cos(v * 4.0 + time * 8.0) * (this.turbulenceEnergy * 0.5)
        : 0;

      const z = wave1 + wave2 + wave3 + ripSample.height * 0.4 + storm;
      position.setZ(i, z);
    }

    position.needsUpdate = true;
    geometry.computeVertexNormals();

    if (this.wireMesh) {
      this.wireMesh.rotation.z = this.mesh.rotation.z;
      this.wireMesh.rotation.x = this.mesh.rotation.x;
    }
  }
}
