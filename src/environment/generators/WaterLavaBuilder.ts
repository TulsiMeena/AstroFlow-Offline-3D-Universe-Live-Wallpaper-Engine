import * as THREE from 'three';
import { PRNG } from '../seed/PRNG';
import { LiquidDNA } from '../types/environmentDNA';
import { QualityConfig } from '../../types/engine';

export class WaterLavaBuilder {
  public static build(liquidDNA: LiquidDNA, prng: PRNG, quality: QualityConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = 'EnvironmentLiquid';

    const resolution = quality.profile === 'LOW' ? 40 : quality.profile === 'MEDIUM' ? 64 : 80;
    const size = 32;

    if (liquidDNA.hasWater) {
      this.buildWaterSurface(group, liquidDNA, resolution, size);
      if (liquidDNA.hasUnderwaterDepth) {
        this.buildUnderwaterElements(group, liquidDNA, prng, quality);
      }
    }

    if (liquidDNA.hasLava) {
      this.buildLavaSurface(group, liquidDNA, resolution, size);
      this.buildLavaEmbers(group, liquidDNA, prng, quality);
    }

    return group;
  }

  private static buildWaterSurface(group: THREE.Group, liquidDNA: LiquidDNA, resolution: number, size: number) {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(liquidDNA.waterColor),
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: 0.88,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = liquidDNA.waterLevel;
    mesh.name = 'WaterPlane';
    mesh.userData = {
      isWater: true,
      waveHeight: liquidDNA.waveHeight,
      waveSpeed: liquidDNA.waveSpeed
    };

    group.add(mesh);
  }

  private static buildUnderwaterElements(group: THREE.Group, liquidDNA: LiquidDNA, prng: PRNG, quality: QualityConfig) {
    const bubbleCount = quality.profile === 'LOW' ? 120 : quality.profile === 'MEDIUM' ? 260 : 500;
    const positions = new Float32Array(bubbleCount * 3);

    for (let i = 0; i < bubbleCount; i++) {
      positions[i * 3] = prng.range(-12, 12);
      positions[i * 3 + 1] = prng.range(liquidDNA.waterLevel - 6, liquidDNA.waterLevel);
      positions[i * 3 + 2] = prng.range(-12, 12);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xa0e8ff,
      size: 0.08,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    points.name = 'UnderwaterBubbles';
    points.userData = { isBubbles: true, waterLevel: liquidDNA.waterLevel };
    group.add(points);
  }

  private static buildLavaSurface(group: THREE.Group, liquidDNA: LiquidDNA, resolution: number, size: number) {
    const geo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geo.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(liquidDNA.lavaColor),
      emissive: new THREE.Color(liquidDNA.lavaGlowColor),
      emissiveIntensity: 0.85,
      roughness: 0.45,
      metalness: 0.2,
      flatShading: true
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = liquidDNA.lavaLevel;
    mesh.name = 'LavaPlane';
    mesh.userData = {
      isLava: true,
      flowSpeed: liquidDNA.lavaFlowSpeed
    };

    group.add(mesh);
  }

  private static buildLavaEmbers(group: THREE.Group, liquidDNA: LiquidDNA, prng: PRNG, quality: QualityConfig) {
    const count = quality.profile === 'LOW' ? 150 : quality.profile === 'MEDIUM' ? 300 : 600;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color(0xff4500);
    const c2 = new THREE.Color(0xffd700);
    const temp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      pos[i * 3] = prng.range(-10, 10);
      pos[i * 3 + 1] = prng.range(liquidDNA.lavaLevel, liquidDNA.lavaLevel + 6);
      pos[i * 3 + 2] = prng.range(-10, 10);

      temp.copy(c1).lerp(c2, prng.next());
      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    points.name = 'LavaEmbers';
    points.userData = { isEmbers: true, lavaLevel: liquidDNA.lavaLevel };
    group.add(points);
  }

  /**
   * Real-time animation update for water & lava surfaces
   */
  public static update(group: THREE.Group, time: number, delta: number) {
    const water = group.getObjectByName('WaterPlane') as THREE.Mesh;
    if (water) {
      const geo = water.geometry as THREE.BufferGeometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const waveHeight = water.userData.waveHeight || 0.4;
      const waveSpeed = water.userData.waveSpeed || 1.2;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const y = Math.sin(x * 0.8 + time * waveSpeed) * Math.cos(z * 0.8 + time * waveSpeed * 0.8) * waveHeight;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }

    const bubbles = group.getObjectByName('UnderwaterBubbles') as THREE.Points;
    if (bubbles) {
      const pos = bubbles.geometry.attributes.position as THREE.BufferAttribute;
      const top = bubbles.userData.waterLevel || 0;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * 1.5;
        if (y > top) y = top - 5;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    const embers = group.getObjectByName('LavaEmbers') as THREE.Points;
    if (embers) {
      const pos = embers.geometry.attributes.position as THREE.BufferAttribute;
      const base = embers.userData.lavaLevel || 0;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + delta * 2.2;
        let x = pos.getX(i) + Math.sin(time * 3 + i) * 0.02;
        if (y > base + 7) {
          y = base;
        }
        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }
  }
}
