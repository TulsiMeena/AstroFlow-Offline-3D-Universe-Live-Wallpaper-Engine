import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';

export class AuroraSkyWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'aurora-sky',
    title: 'Aurora Sky',
    subtitle: 'Polar Borealis Curtains',
    category: 'Nature',
    description: 'Ethereal curtains of geomagnetic emerald and violet auroral ribbons undulating silently across a starlit night sky.',
    author: 'Amit Meena',
    tags: ['Aurora', 'Borealis', 'Sky', 'Night', 'Atmospheric'],
    accentColor: '#00FF88',
    secondaryColor: '#B000FF',
    interactive: true,
    proceduralType: 'mesh'
  };

  private ribbons: THREE.Mesh[] = [];
  private starField: THREE.Points | null = null;
  private ribbonGeometries: THREE.PlaneGeometry[] = [];

  protected buildScene(): void {
    // 1. Star background
    const starCount = 1500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPos[i3] = (Math.random() - 0.5) * 40;
      starPos[i3 + 1] = Math.random() * 20 - 2;
      starPos[i3 + 2] = -10 - Math.random() * 20;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.8
    });
    this.starField = new THREE.Points(starGeo, starMat);
    this.rootGroup.add(this.starField);

    // 2. Multi-layer Aurora Curtains
    const ribbonColors = [
      { color: 0x00ff88, emissive: 0x00aa44, z: -2, y: 1.2 },
      { color: 0x00e5ff, emissive: 0x0077aa, z: -4, y: 2.0 },
      { color: 0xb000ff, emissive: 0x5500aa, z: -6, y: 2.8 }
    ];

    ribbonColors.forEach(cfg => {
      const geo = new THREE.PlaneGeometry(16, 5, 48, 16);
      this.ribbonGeometries.push(geo);

      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, cfg.y, cfg.z);
      mesh.rotation.x = 0.2;
      this.ribbons.push(mesh);
      this.rootGroup.add(mesh);
    });
  }

  public update(ctx: WallpaperUpdateContext): void {
    const time = ctx.time * 0.8;

    this.ribbonGeometries.forEach((geo, idx) => {
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const speed = 1.0 + idx * 0.3;
      const phase = idx * 1.5;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);

        // Sinusoidal ribbon waves
        const wave = Math.sin(x * 0.4 + time * speed + phase) * 0.8 + Math.cos(x * 0.8 - time * 0.5) * 0.3;
        const verticalFlutter = Math.sin(y * 0.8 + time) * 0.2;

        pos.setZ(i, wave + verticalFlutter);
      }
      pos.needsUpdate = true;
    });

    // Parallax
    this.rootGroup.rotation.y = ctx.input.x * 0.2;
    this.rootGroup.rotation.x = -ctx.input.y * 0.15;
  }
}
