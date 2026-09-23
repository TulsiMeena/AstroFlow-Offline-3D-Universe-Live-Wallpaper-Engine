import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';

export class GalaxyCoreWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'galaxy-core',
    title: 'Galaxy Core',
    subtitle: 'Luminous Spiral Accretion Disk',
    category: 'Cosmic',
    description: 'A dense supermassive galactic center with dual counter-rotating spiral arms and glowing interstellar dust clouds.',
    author: 'Amit Meena',
    tags: ['Galaxy', 'Space', 'Stars', 'Spiral', 'Atmospheric'],
    accentColor: '#FF6B00',
    secondaryColor: '#9D00FF',
    interactive: true,
    proceduralType: 'particles'
  };

  private stars: THREE.Points | null = null;
  private coreMesh: THREE.Mesh | null = null;
  private ringMesh: THREE.Mesh | null = null;
  private starCount: number = 7000;

  protected buildScene(): void {
    if (!this.quality) return;
    this.starCount = Math.min(9000, this.quality.maxParticleCount);

    const count = this.starCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const coreColor = new THREE.Color(0xffcc00);
    const innerColor = new THREE.Color(0xff0077);
    const armColor = new THREE.Color(0x9d00ff);
    const outerColor = new THREE.Color(0x00f0ff);
    const tempColor = new THREE.Color();

    const arms = 3;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Galaxy arm math
      const r = Math.pow(Math.random(), 2.0) * 7 + 0.3;
      const armIndex = i % arms;
      const armOffset = (armIndex * 2 * Math.PI) / arms;
      const spiralAngle = r * 1.3;

      // Gaussian-like dispersion around arm centerline
      const dispersion = (1 - Math.exp(-r * 0.5)) * 0.45;
      const spreadX = (Math.random() - 0.5) * dispersion * (r + 0.5);
      const spreadY = (Math.random() - 0.5) * 0.35 * Math.max(0.2, 3 - r * 0.3);
      const spreadZ = (Math.random() - 0.5) * dispersion * (r + 0.5);

      const angle = armOffset + spiralAngle;
      positions[i3] = Math.cos(angle) * r + spreadX;
      positions[i3 + 1] = spreadY;
      positions[i3 + 2] = Math.sin(angle) * r + spreadZ;

      // Color gradation by radial distance
      const normR = r / 7;
      if (normR < 0.2) {
        tempColor.copy(coreColor).lerp(innerColor, normR / 0.2);
      } else if (normR < 0.6) {
        tempColor.copy(innerColor).lerp(armColor, (normR - 0.2) / 0.4);
      } else {
        tempColor.copy(armColor).lerp(outerColor, (normR - 0.6) / 0.4);
      }

      colors[i3] = tempColor.r;
      colors[i3 + 1] = tempColor.g;
      colors[i3 + 2] = tempColor.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.3, 'rgba(255,160,0,0.8)');
      grad.addColorStop(0.8, 'rgba(157,0,255,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      map: texture,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stars = new THREE.Points(geometry, material);
    this.rootGroup.add(this.stars);

    // Supermassive Black Hole Accretion Disk Core
    const coreGeo = new THREE.SphereGeometry(0.4, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
      wireframe: false
    });
    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.rootGroup.add(this.coreMesh);

    // Accretion Ring
    const ringGeo = new THREE.RingGeometry(0.5, 1.4, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.ringMesh.rotation.x = Math.PI / 2.2;
    this.rootGroup.add(this.ringMesh);

    // Tilt galaxy slightly for cinematic angle
    this.rootGroup.rotation.x = 0.65;
  }

  public update(ctx: WallpaperUpdateContext): void {
    const time = ctx.time * 0.3;

    if (this.stars) {
      this.stars.rotation.y = time * 0.4;
    }

    if (this.coreMesh) {
      const pulse = 1.0 + Math.sin(time * 4) * 0.08;
      this.coreMesh.scale.set(pulse, pulse, pulse);
    }

    if (this.ringMesh) {
      this.ringMesh.rotation.z = -time * 0.8;
    }

    // Parallax response
    this.rootGroup.rotation.y = time * 0.15 + ctx.input.x * 0.4;
    this.rootGroup.rotation.x = 0.65 + ctx.input.y * 0.25;
  }
}
