import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';

export class CyberGridWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'cyber-grid',
    title: 'Cyber Grid',
    subtitle: 'Outrun Synthwave Horizon',
    category: 'Cyberpunk',
    description: 'An endless futuristic highway running across wireframe neon terrain beneath a radiant retro synthwave sun.',
    author: 'Amit Meena',
    tags: ['Synthwave', 'Cyberpunk', 'Grid', 'Retro', 'Neon'],
    accentColor: '#FF007F',
    secondaryColor: '#00F0FF',
    interactive: true,
    proceduralType: 'grid'
  };

  private terrainMesh: THREE.Mesh | null = null;
  private sunMesh: THREE.Mesh | null = null;
  private sunRays: THREE.Mesh | null = null;
  private gridOffset: number = 0;

  protected buildScene(): void {
    // 1. Terrain Grid
    const width = 24;
    const depth = 30;
    const segmentsX = 48;
    const segmentsZ = 48;
    const terrainGeo = new THREE.PlaneGeometry(width, depth, segmentsX, segmentsZ);

    // Initial mountain elevation
    const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Mountain valleys on flanks, flat center corridor for road
      const distFromCenter = Math.abs(x);
      let height = 0;
      if (distFromCenter > 3.0) {
        const factor = (distFromCenter - 3.0) * 0.7;
        height = Math.sin(y * 0.4 + x * 0.3) * factor + Math.cos(x * 0.8) * factor * 0.5;
      }
      pos.setZ(i, Math.max(0, height));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshBasicMaterial({
      color: 0xff007f,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });

    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.rotation.x = -Math.PI / 2.2;
    this.terrainMesh.position.set(0, -1.2, -5);
    this.rootGroup.add(this.terrainMesh);

    // 2. Neon Synthwave Sun
    const sunGeo = new THREE.CircleGeometry(4.0, 48);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      side: THREE.DoubleSide
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(0, 3.5, -16);
    this.rootGroup.add(this.sunMesh);

    // 3. Sun Scanline Cutouts
    const raysGeo = new THREE.PlaneGeometry(8.2, 4.2, 1, 10);
    const raysMat = new THREE.MeshBasicMaterial({
      color: 0x05070e,
      wireframe: true
    });
    this.sunRays = new THREE.Mesh(raysGeo, raysMat);
    this.sunRays.position.set(0, 2.5, -15.9);
    this.rootGroup.add(this.sunRays);
  }

  public update(ctx: WallpaperUpdateContext): void {
    const time = ctx.time;
    const speed = ctx.delta * 4.0;

    this.gridOffset = (this.gridOffset + speed) % 2.0;

    if (this.terrainMesh) {
      this.terrainMesh.position.z = -5 + this.gridOffset;
    }

    if (this.sunMesh) {
      const pulse = 1.0 + Math.sin(time * 2.0) * 0.04;
      this.sunMesh.scale.set(pulse, pulse, 1.0);
    }

    // Parallax
    this.rootGroup.rotation.y = ctx.input.x * 0.2;
    this.rootGroup.rotation.x = -ctx.input.y * 0.15;
  }
}
