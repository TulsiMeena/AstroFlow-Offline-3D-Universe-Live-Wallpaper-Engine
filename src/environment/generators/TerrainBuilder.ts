import * as THREE from 'three';
import { PRNG } from '../seed/PRNG';
import { TerrainDNA } from '../types/environmentDNA';
import { QualityConfig } from '../../types/engine';

export class TerrainBuilder {
  public static build(terrainDNA: TerrainDNA, prng: PRNG, quality: QualityConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = 'EnvironmentTerrain';

    const resolution = quality.profile === 'LOW' ? 48 : quality.profile === 'MEDIUM' ? 72 : 96;
    const size = 32;

    if (terrainDNA.type === 'floating-rocks') {
      TerrainBuilder.buildFloatingRocks(group, terrainDNA, prng, quality);
      return group;
    }

    if (terrainDNA.type === 'caves') {
      TerrainBuilder.buildCaveTerrain(group, terrainDNA, prng, resolution, size);
      return group;
    }

    const geometry = new THREE.PlaneGeometry(size, size, resolution, resolution);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(positions.count * 3);

    const colPrimary = new THREE.Color(terrainDNA.colorPrimary);
    const colSecondary = new THREE.Color(terrainDNA.colorSecondary);
    const colRock = new THREE.Color(terrainDNA.colorRock);
    const tempCol = new THREE.Color();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      let y = 0;
      const nx = x * 0.08 * terrainDNA.roughness;
      const nz = z * 0.08 * terrainDNA.roughness;

      switch (terrainDNA.type) {
        case 'mountains': {
          const base = prng.fbm2D(nx, nz, 4, 0.55);
          const ridges = 1.0 - Math.abs(prng.fbm2D(nx * 1.5, nz * 1.5, 3, 0.5) * 2.0 - 1.0);
          y = (base * 0.6 + ridges * 0.8) * terrainDNA.heightScale * 3.5;
          break;
        }
        case 'rolling-hills': {
          y = Math.sin(nx * 2) * Math.cos(nz * 2) * 1.2 * terrainDNA.heightScale;
          y += prng.fbm2D(nx * 0.5, nz * 0.5, 3, 0.4) * 1.8 * terrainDNA.heightScale;
          break;
        }
        case 'canyons': {
          const val = prng.fbm2D(nx * 0.8, nz * 0.8, 3, 0.5);
          y = Math.pow(val, 2.5) * terrainDNA.heightScale * 4.0;
          if (Math.abs(x) < 3.5) {
            y *= 0.15;
          }
          break;
        }
        case 'dunes': {
          y = (Math.sin(nx * 3.0 + nz * 1.5) * 0.5 + 0.5) * terrainDNA.heightScale * 2.0;
          y += prng.fbm2D(nx * 0.4, nz * 0.4, 2, 0.3) * 0.8;
          break;
        }
        case 'cyber-grid': {
          y = Math.floor(prng.fbm2D(nx * 2, nz * 2, 2, 0.5) * 4.0) * 0.4 * terrainDNA.heightScale;
          break;
        }
        case 'fractal': {
          y = (Math.sin(x * 1.2) * Math.sin(z * 1.2) + Math.cos(x * 2.4) * Math.cos(z * 2.4) * 0.5) * terrainDNA.heightScale * 1.5;
          break;
        }
        case 'flat':
        default: {
          y = prng.fbm2D(nx * 0.2, nz * 0.2, 2, 0.3) * 0.4 * terrainDNA.heightScale;
          break;
        }
      }

      // Plateau clamping
      if (terrainDNA.plateauRatio > 0 && y > terrainDNA.heightScale * 2.0 * (1.0 - terrainDNA.plateauRatio)) {
        y = terrainDNA.heightScale * 2.0 * (1.0 - terrainDNA.plateauRatio);
      }

      positions.setY(i, y);

      // Procedural height & slope based vertex coloring
      const heightFactor = THREE.MathUtils.clamp((y + 1) / (terrainDNA.heightScale * 3.5 + 1.0), 0, 1);
      if (heightFactor > 0.65) {
        tempCol.copy(colRock).lerp(colSecondary, (heightFactor - 0.65) / 0.35);
      } else if (heightFactor > 0.25) {
        tempCol.copy(colPrimary).lerp(colRock, (heightFactor - 0.25) / 0.4);
      } else {
        tempCol.copy(colPrimary);
      }

      colors[i * 3] = tempCol.r;
      colors[i * 3 + 1] = tempCol.g;
      colors[i * 3 + 2] = tempCol.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.15,
      wireframe: terrainDNA.wireframe,
      flatShading: terrainDNA.type === 'mountains' || terrainDNA.type === 'canyons'
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    mesh.castShadow = true;
    group.add(mesh);

    // Optional cyber-grid lines overlay
    if (terrainDNA.type === 'cyber-grid' && !terrainDNA.wireframe) {
      const gridMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(terrainDNA.colorSecondary),
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const gridMesh = new THREE.Mesh(geometry, gridMat);
      gridMesh.position.y += 0.02;
      group.add(gridMesh);
    }

    return group;
  }

  private static buildFloatingRocks(group: THREE.Group, terrainDNA: TerrainDNA, prng: PRNG, quality: QualityConfig): void {
    const rockCount = quality.profile === 'LOW' ? 14 : quality.profile === 'MEDIUM' ? 24 : 36;
    const rockMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(terrainDNA.colorRock),
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    for (let i = 0; i < rockCount; i++) {
      const radius = prng.range(0.6, 2.4);
      const detail = prng.intRange(0, 2);
      const geo = new THREE.DodecahedronGeometry(radius, detail);

      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let v = 0; v < pos.count; v++) {
        const vx = pos.getX(v);
        const vy = pos.getY(v);
        const vz = pos.getZ(v);
        const disp = 1.0 + (prng.next() - 0.5) * 0.45;
        pos.setXYZ(v, vx * disp, vy * disp, vz * disp);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, rockMat);
      mesh.position.set(
        prng.range(-14, 14),
        prng.range(-2, 8) + Math.sin(i) * 2,
        prng.range(-14, 14)
      );
      mesh.rotation.set(prng.range(0, Math.PI), prng.range(0, Math.PI), prng.range(0, Math.PI));
      mesh.userData = {
        floatSpeed: prng.range(0.4, 1.2),
        floatOffset: prng.range(0, Math.PI * 2),
        initialY: mesh.position.y
      };

      group.add(mesh);
    }
  }

  private static buildCaveTerrain(group: THREE.Group, terrainDNA: TerrainDNA, prng: PRNG, resolution: number, size: number): void {
    const floorGeo = new THREE.PlaneGeometry(size, size, resolution, resolution);
    floorGeo.rotateX(-Math.PI / 2);
    const floorPos = floorGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < floorPos.count; i++) {
      const x = floorPos.getX(i);
      const z = floorPos.getZ(i);
      const y = prng.fbm2D(x * 0.1, z * 0.1, 3, 0.5) * 1.5;
      floorPos.setY(i, y - 2);
    }
    floorGeo.computeVertexNormals();

    const caveMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(terrainDNA.colorRock),
      roughness: 0.95,
      flatShading: true
    });
    const floorMesh = new THREE.Mesh(floorGeo, caveMat);
    group.add(floorMesh);

    const ceilGeo = new THREE.PlaneGeometry(size, size, Math.floor(resolution / 2), Math.floor(resolution / 2));
    ceilGeo.rotateX(Math.PI / 2);
    const ceilPos = ceilGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < ceilPos.count; i++) {
      const x = ceilPos.getX(i);
      const z = ceilPos.getZ(i);
      let y = 6 - (x * x + z * z) * 0.015;
      if (prng.chance(0.08)) {
        y -= prng.range(1.0, 3.5);
      }
      ceilPos.setY(i, y);
    }
    ceilGeo.computeVertexNormals();
    const ceilMesh = new THREE.Mesh(ceilGeo, caveMat);
    group.add(ceilMesh);
  }
}
