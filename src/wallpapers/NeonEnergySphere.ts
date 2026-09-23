import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';

export class NeonEnergySphereWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'neon-energy-sphere',
    title: 'Neon Energy Sphere',
    subtitle: 'Cybernetic Plasma Reactor',
    category: 'Energy',
    description: 'An oscillating high-voltage polyhedral core encased in concentric counter-rotating energy shells, responding to phone tilt, tap energy bursts, and interactive plasma trails.',
    author: 'Amit Meena',
    tags: ['Cyberpunk', 'Energy', 'Neon', '3D Geometry', 'Futuristic', 'Motion Reaction'],
    accentColor: '#00FFA3',
    secondaryColor: '#0066FF',
    interactive: true,
    proceduralType: 'mesh'
  };

  private icosahedronMesh: THREE.Mesh | null = null;
  private outerLatticeMesh: THREE.Mesh | null = null;
  private ringMesh1: THREE.Mesh | null = null;
  private ringMesh2: THREE.Mesh | null = null;
  private plasmaPoints: THREE.Points | null = null;
  private pointCount: number = 1800;

  protected buildScene(): void {
    // 1. Inner core: Icosahedron with wireframe and emissive lighting
    const icoGeo = new THREE.IcosahedronGeometry(1.2, 1);
    const icoMat = new THREE.MeshBasicMaterial({
      color: 0x00ffa3,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    this.icosahedronMesh = new THREE.Mesh(icoGeo, icoMat);
    this.rootGroup.add(this.icosahedronMesh);

    // 2. Outer geodesic cage
    const outerGeo = new THREE.DodecahedronGeometry(2.0, 1);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      wireframe: true,
      transparent: true,
      opacity: 0.45
    });
    this.outerLatticeMesh = new THREE.Mesh(outerGeo, outerMat);
    this.rootGroup.add(this.outerLatticeMesh);

    // 3. Dual Gimbal Rings
    const ringGeo1 = new THREE.TorusGeometry(2.5, 0.03, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x00ffa3,
      transparent: true,
      opacity: 0.7
    });
    this.ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    this.rootGroup.add(this.ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(2.8, 0.02, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0xaa00ff,
      transparent: true,
      opacity: 0.6
    });
    this.ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    this.ringMesh2.rotation.x = Math.PI / 2;
    this.rootGroup.add(this.ringMesh2);

    // 4. Orbiting Plasma Nodes
    const count = this.pointCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const color1 = new THREE.Color(0x00ffa3);
    const color2 = new THREE.Color(0x0066ff);
    const temp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.3 + Math.random() * 1.8;

      positions[i3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = r * Math.cos(phi);

      temp.copy(color1).lerp(color2, Math.random());
      colors[i3] = temp.r;
      colors[i3 + 1] = temp.g;
      colors[i3 + 2] = temp.b;
    }

    const plasmaGeo = new THREE.BufferGeometry();
    plasmaGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    plasmaGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const plasmaMat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    this.plasmaPoints = new THREE.Points(plasmaGeo, plasmaMat);
    this.rootGroup.add(this.plasmaPoints);
  }

  public update(ctx: WallpaperUpdateContext): void {
    const time = ctx.time * 0.5;

    // Motion perspective from gyro
    const tiltX = ctx.motion.tiltX;
    const tiltY = ctx.motion.tiltY;

    // Energy burst reaction
    const energy = ctx.energyReaction.brightness;

    if (this.icosahedronMesh) {
      this.icosahedronMesh.rotation.x = time * 0.6 + tiltY * 0.4;
      this.icosahedronMesh.rotation.y = time * 0.8 + tiltX * 0.4;
      const pulse = (1.0 + Math.sin(time * 3.5) * 0.12) * energy;
      this.icosahedronMesh.scale.set(pulse, pulse, pulse);
    }

    if (this.outerLatticeMesh) {
      this.outerLatticeMesh.rotation.x = -time * 0.3 - tiltY * 0.3;
      this.outerLatticeMesh.rotation.z = time * 0.4 + tiltX * 0.3;
    }

    if (this.ringMesh1) {
      this.ringMesh1.rotation.x = time * 0.7 + tiltY * 0.2;
      this.ringMesh1.rotation.y = time * 0.5 + tiltX * 0.2;
    }

    if (this.ringMesh2) {
      this.ringMesh2.rotation.y = -time * 0.6 + tiltX * 0.3;
      this.ringMesh2.rotation.z = time * 0.4 + tiltY * 0.3;
    }

    if (this.plasmaPoints) {
      this.plasmaPoints.rotation.y = time * 0.25 + tiltX * 0.2;
      this.plasmaPoints.rotation.x = time * 0.15 + tiltY * 0.2;
    }

    // Touch interaction
    this.rootGroup.rotation.y = tiltX * 0.6 + ctx.input.x * 0.4;
    this.rootGroup.rotation.x = -tiltY * 0.6 - ctx.input.y * 0.4;
  }
}
