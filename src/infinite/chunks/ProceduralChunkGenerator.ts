import * as THREE from 'three';
import {
  ChunkCoord,
  WorldChunk,
  ChunkEntityData,
  FusionDNA
} from '../types/infiniteTypes';

export class ProceduralChunkGenerator {
  private static sharedGeometries: Map<string, THREE.BufferGeometry> = new Map();
  private static sharedMaterials: Map<string, THREE.Material> = new Map();

  /**
   * Deterministic pseudo-random number generator for chunk coords
   */
  public static getChunkSeed(baseSeed: number, cx: number, cz: number): number {
    let s = (baseSeed ^ (cx * 73856093) ^ (cz * 19349663)) >>> 0;
    s = (s ^ (s >> 16)) * 0x45d9f3b;
    s = (s ^ (s >> 16)) * 0x45d9f3b;
    s = (s ^ (s >> 16)) >>> 0;
    return s;
  }

  private static makeRNG(seed: number) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /**
   * Deterministic elevation function based on fused biomes and multi-octave synthesis
   */
  public static getElevationAt(worldX: number, worldZ: number, dna: FusionDNA): number {
    const scale = 0.015;
    const x = worldX * scale;
    const z = worldZ * scale;

    // Octave 1: Large terrain continents/ridges
    const o1 = Math.sin(x * 0.7 + Math.cos(z * 0.5)) * 14.0 + Math.cos(z * 0.8 + Math.sin(x * 0.4)) * 12.0;

    // Octave 2: Hills and riverbeds
    const o2 = Math.sin(x * 2.1 + z * 1.5) * 5.5 + Math.cos(x * 1.8 - z * 2.3) * 4.5;

    // Octave 3: Local crags and detail
    const o3 = Math.sin(x * 5.2 - z * 4.8) * 1.8;

    let baseHeight = o1 + o2 + o3;

    // Biome-specific shaping
    if (dna.primarySystem === 'mountain' || dna.secondarySystem === 'mountain') {
      baseHeight = Math.abs(baseHeight) * 1.8 - 6.0;
    } else if (dna.primarySystem === 'ocean' || dna.secondarySystem === 'ocean') {
      baseHeight = baseHeight * 0.7 - 8.0;
    } else if (dna.primarySystem === 'cyber-city' || dna.secondarySystem === 'cyber-city') {
      // Step terraces for cyber levels
      baseHeight = Math.floor(baseHeight / 3.0) * 3.0;
    } else if (dna.primarySystem === 'volcano' || dna.secondarySystem === 'volcano') {
      const distFromCrater = Math.sqrt((worldX % 200) ** 2 + (worldZ % 200) ** 2);
      if (distFromCrater < 60) {
        baseHeight = -Math.sin(distFromCrater * 0.05) * 12.0;
      }
    } else if (dna.primarySystem === 'floating-islands' || dna.secondarySystem === 'floating-islands') {
      if (baseHeight < 0) baseHeight = -30; // Chasm
    }

    return baseHeight;
  }

  /**
   * Generates or populates a WorldChunk
   */
  public static generateChunk(
    coord: ChunkCoord,
    chunkSize: number,
    baseSeed: number,
    dna: FusionDNA,
    lodLevel: number = 0
  ): WorldChunk {
    const chunkSeed = this.getChunkSeed(baseSeed, coord.x, coord.z);
    const rng = this.makeRNG(chunkSeed);

    const worldX = coord.x * chunkSize;
    const worldZ = coord.z * chunkSize;

    const group = new THREE.Group();
    group.name = `Chunk_${coord.x}_${coord.z}`;
    group.position.set(worldX, 0, worldZ);

    // 1. Terrain Mesh
    const segments = lodLevel === 0 ? 16 : lodLevel === 1 ? 8 : 4;
    const geo = new THREE.PlaneGeometry(chunkSize, chunkSize, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const posAttr = geo.attributes.position;
    const count = posAttr.count;
    const colors = new Float32Array(count * 3);

    const colorLow = new THREE.Color(dna.primaryColor);
    const colorMid = new THREE.Color(dna.secondaryColor);
    const colorHigh = new THREE.Color(dna.accentColor);
    const tempColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const localVx = posAttr.getX(i);
      const localVz = posAttr.getZ(i);
      const sampleWorldX = worldX + localVx;
      const sampleWorldZ = worldZ + localVz;

      const h = this.getElevationAt(sampleWorldX, sampleWorldZ, dna);
      posAttr.setY(i, h);

      // Height-based blended vertex coloring
      const normH = Math.min(Math.max((h + 12) / 32, 0), 1);
      if (normH < 0.4) {
        tempColor.copy(colorLow).lerp(colorMid, normH / 0.4);
      } else {
        tempColor.copy(colorMid).lerp(colorHigh, (normH - 0.4) / 0.6);
      }

      // Add deterministic slight mineral variegation
      const noiseVar = (rng() - 0.5) * 0.1;
      tempColor.r = Math.min(Math.max(tempColor.r + noiseVar, 0), 1);
      tempColor.g = Math.min(Math.max(tempColor.g + noiseVar, 0), 1);
      tempColor.b = Math.min(Math.max(tempColor.b + noiseVar, 0), 1);

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.75,
      metalness: dna.primarySystem === 'cyber-city' || dna.primarySystem === 'crystal' ? 0.4 : 0.1,
      flatShading: lodLevel > 0
    });

    const terrainMesh = new THREE.Mesh(geo, mat);
    terrainMesh.receiveShadow = true;
    group.add(terrainMesh);

    // 2. Procedural Feature Objects (Foliage, Crystals, Monoliths, Spores)
    const featureGroup = new THREE.Group();
    group.add(featureGroup);

    const featureCount = lodLevel === 0 ? Math.floor(6 + rng() * 6) : lodLevel === 1 ? 3 : 1;
    for (let f = 0; f < featureCount; f++) {
      const fx = (rng() - 0.5) * (chunkSize * 0.85);
      const fz = (rng() - 0.5) * (chunkSize * 0.85);
      const fy = this.getElevationAt(worldX + fx, worldZ + fz, dna);

      const featureObj = this.createProceduralFeature(dna, rng);
      featureObj.position.set(fx, fy, fz);
      featureGroup.add(featureObj);
    }

    // 3. Chunk Atmospheric Ambient Particles
    let particlePoints: THREE.Points | null = null;
    const particleCount = lodLevel === 0 ? 32 : lodLevel === 1 ? 16 : 6;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      const px = (rng() - 0.5) * chunkSize;
      const pz = (rng() - 0.5) * chunkSize;
      const groundY = this.getElevationAt(worldX + px, worldZ + pz, dna);
      const py = groundY + 2 + rng() * 15;

      particlePositions[p * 3] = px;
      particlePositions[p * 3 + 1] = py;
      particlePositions[p * 3 + 2] = pz;

      const pCol = rng() > 0.5 ? colorMid : colorHigh;
      particleColors[p * 3] = pCol.r;
      particleColors[p * 3 + 1] = pCol.g;
      particleColors[p * 3 + 2] = pCol.b;
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 0.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });

    particlePoints = new THREE.Points(pGeo, pMat);
    group.add(particlePoints);

    // 4. Local Chunk Point Light (Every few chunks have a glow beacon)
    let light: THREE.PointLight | null = null;
    if (rng() > 0.45 && lodLevel < 2) {
      const lx = (rng() - 0.5) * (chunkSize * 0.6);
      const lz = (rng() - 0.5) * (chunkSize * 0.6);
      const ly = this.getElevationAt(worldX + lx, worldZ + lz, dna) + 4;
      light = new THREE.PointLight(new THREE.Color(dna.accentColor), 1.2, chunkSize * 0.8);
      light.position.set(lx, ly, lz);
      group.add(light);
    }

    // 5. Procedural Life Entities Data for this chunk
    const entities: ChunkEntityData[] = [];
    if (dna.allowedEntities.length > 0 && rng() > 0.3) {
      const entityCount = Math.floor(1 + rng() * 3);
      for (let e = 0; e < entityCount; e++) {
        const entType = dna.allowedEntities[Math.floor(rng() * dna.allowedEntities.length)];
        const ex = (rng() - 0.5) * (chunkSize * 0.7);
        const ez = (rng() - 0.5) * (chunkSize * 0.7);
        const ey = this.getElevationAt(worldX + ex, worldZ + ez, dna) + 1.5 + rng() * 6;

        entities.push({
          id: `entity_${coord.x}_${coord.z}_${e}`,
          type: entType,
          position: new THREE.Vector3(worldX + ex, ey, worldZ + ez),
          scale: 0.6 + rng() * 0.8,
          rotationY: rng() * Math.PI * 2,
          color: new THREE.Color(dna.accentColor)
        });
      }
    }

    return {
      coord,
      worldPosition: new THREE.Vector3(worldX, 0, worldZ),
      seed: chunkSeed,
      group,
      terrainMesh,
      featureGroup,
      particlePoints,
      light,
      entities,
      isLoaded: true,
      lastUsedTime: Date.now(),
      lodLevel
    };
  }

  /**
   * Helper to create procedural foliage / structures
   */
  private static createProceduralFeature(dna: FusionDNA, rng: () => number): THREE.Object3D {
    const isCyber = dna.primarySystem === 'cyber-city' || dna.secondarySystem === 'cyber-city';
    const isCrystal = dna.primarySystem === 'crystal' || dna.secondarySystem === 'crystal';
    const isSpace = dna.primarySystem === 'space' || dna.primarySystem === 'galaxy';

    if (isCyber) {
      // Cyber neon tower / monolith
      const w = 1.5 + rng() * 2.5;
      const h = 5 + rng() * 14;
      const d = 1.5 + rng() * 2.5;
      const boxGeo = new THREE.BoxGeometry(w, h, d);
      const boxMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0A0C16'),
        metalness: 0.8,
        roughness: 0.2,
        emissive: new THREE.Color(dna.accentColor),
        emissiveIntensity: 0.35
      });
      const tower = new THREE.Mesh(boxGeo, boxMat);
      tower.position.y = h / 2;
      return tower;
    }

    if (isCrystal) {
      // Glowing crystal cluster
      const h = 3 + rng() * 6;
      const rad = 0.8 + rng() * 1.2;
      const octGeo = new THREE.OctahedronGeometry(rad, 0);
      octGeo.scale(1, h / (rad * 2), 1);
      const octMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(dna.accentColor),
        emissive: new THREE.Color(dna.secondaryColor),
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.9
      });
      const crystal = new THREE.Mesh(octGeo, octMat);
      crystal.position.y = h / 2;
      crystal.rotation.y = rng() * Math.PI;
      crystal.rotation.z = (rng() - 0.5) * 0.3;
      return crystal;
    }

    if (isSpace) {
      // Floating astral asteroid / artefact
      const rad = 1.2 + rng() * 2.0;
      const astGeo = new THREE.DodecahedronGeometry(rad, 1);
      const astMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(dna.primaryColor),
        emissive: new THREE.Color(dna.secondaryColor),
        emissiveIntensity: 0.4,
        roughness: 0.8
      });
      const asteroid = new THREE.Mesh(astGeo, astMat);
      asteroid.position.y = 3 + rng() * 8;
      asteroid.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      return asteroid;
    }

    // Default: Procedural bioluminescent tree/shrub
    const trunkH = 2.5 + rng() * 4.0;
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, trunkH, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a1a24'),
      roughness: 0.8
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = trunkH / 2;

    const foliageR = 1.2 + rng() * 1.8;
    const foliageGeo = new THREE.IcosahedronGeometry(foliageR, 1);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dna.secondaryColor),
      emissive: new THREE.Color(dna.accentColor),
      emissiveIntensity: 0.45,
      roughness: 0.4
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = trunkH;

    const treeGroup = new THREE.Group();
    treeGroup.add(trunk);
    treeGroup.add(foliage);
    return treeGroup;
  }

  /**
   * Cleans and disposes a chunk safely to avoid memory leaks
   */
  public static disposeChunk(chunk: WorldChunk): void {
    if (chunk.terrainMesh) {
      chunk.terrainMesh.geometry.dispose();
      if (Array.isArray(chunk.terrainMesh.material)) {
        chunk.terrainMesh.material.forEach((m) => m.dispose());
      } else {
        chunk.terrainMesh.material.dispose();
      }
    }

    if (chunk.particlePoints) {
      chunk.particlePoints.geometry.dispose();
      if (Array.isArray(chunk.particlePoints.material)) {
        chunk.particlePoints.material.forEach((m) => m.dispose());
      } else {
        chunk.particlePoints.material.dispose();
      }
    }

    chunk.featureGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });

    if (chunk.light) {
      chunk.light.dispose();
    }

    chunk.group.clear();
    chunk.isLoaded = false;
  }
}
