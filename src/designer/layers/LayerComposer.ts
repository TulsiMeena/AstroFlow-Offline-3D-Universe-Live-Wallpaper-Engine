import * as THREE from 'three';
import { DesignDNA, LayerType, FusionElement } from '../types/designDNA';
import { MaterialGenerator } from '../materials/MaterialGenerator';
import { QualityConfig } from '../../types/engine';

export class LayerComposer {
  public readonly rootGroup: THREE.Group;
  private layerGroups: Map<LayerType, THREE.Group> = new Map();
  private materialGenerator: MaterialGenerator;

  // Layer specific meshes/buffers
  private backgroundMesh: THREE.Points | null = null;
  private skyMesh: THREE.Mesh | null = null;
  private terrainMesh: THREE.Mesh | null = null;
  private mainObjectMesh: THREE.Group | null = null;
  private particlesPoints: THREE.Points | null = null;
  private foregroundPoints: THREE.Points | null = null;
  private atmosphereMesh: THREE.Mesh | null = null;

  // Lights
  private ambientLight: THREE.AmbientLight | null = null;
  private primaryLight: THREE.PointLight | null = null;
  private secondaryLight: THREE.PointLight | null = null;

  // Particle buffers & physics
  private particlePositions: Float32Array = new Float32Array(0);
  private particleVelocities: Float32Array = new Float32Array(0);
  private particleCount: number = 4000;
  private foregroundCount: number = 200;

  // Internal topology hash to prevent recreating geometry needlessly
  private currentTopologyHash: string = '';

  constructor(materialGenerator: MaterialGenerator) {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = 'WallpaperFusionRoot';
    this.materialGenerator = materialGenerator;

    const layerNames: LayerType[] = [
      'Background', 'Sky', 'Environment', 'Terrain', 'Main Object',
      'Particles', 'Atmosphere', 'Lighting', 'Effects', 'Foreground'
    ];

    layerNames.forEach(name => {
      const g = new THREE.Group();
      g.name = `Layer_${name}`;
      this.layerGroups.set(name, g);
      this.rootGroup.add(g);
    });
  }

  public getLayerGroup(type: LayerType): THREE.Group | undefined {
    return this.layerGroups.get(type);
  }

  /**
   * Builds or incrementally updates the procedural scene based on DesignDNA
   */
  public buildOrUpdate(dna: DesignDNA, quality: QualityConfig, forceRebuild: boolean = false): void {
    const topologyHash = `${dna.elements.sort().join('_')}_${dna.material.type}_${quality.profile}`;

    if (forceRebuild || topologyHash !== this.currentTopologyHash) {
      this.rebuildTopology(dna, quality);
      this.currentTopologyHash = topologyHash;
    }

    this.applyLayerSettings(dna);
  }

  /**
   * Full rebuild of geometries when elements or material types change
   */
  private rebuildTopology(dna: DesignDNA, quality: QualityConfig): void {
    // 1. Clear existing layer children
    this.layerGroups.forEach(g => {
      while (g.children.length > 0) {
        const obj = g.children[0];
        g.remove(obj);
        if ((obj as any).geometry) (obj as any).geometry.dispose();
      }
    });

    const elements = dna.elements;
    const colors = dna.colors;

    // --- 1. Background (Cosmic stars or deep space sphere) ---
    const bgGroup = this.layerGroups.get('Background')!;
    const bgStarCount = quality.profile === 'LOW' ? 800 : quality.profile === 'MEDIUM' ? 1800 : 3500;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgStarCount * 3);
    for (let i = 0; i < bgStarCount; i++) {
      const i3 = i * 3;
      const radius = 80 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      bgPos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      bgPos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      bgPos[i3 + 2] = radius * Math.cos(phi);
    }
    bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    const bgMat = new THREE.PointsMaterial({
      color: new THREE.Color(colors.primary).lerp(new THREE.Color(0xffffff), 0.4),
      size: 0.8,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.backgroundMesh = new THREE.Points(bgGeo, bgMat);
    bgGroup.add(this.backgroundMesh);

    // --- 2. Sky Layer (Nebula curtain or Aurora ribbon) ---
    const skyGroup = this.layerGroups.get('Sky')!;
    if (elements.some(e => ['AURORA', 'NEBULA', 'GALAXY', 'SPACE'].includes(e))) {
      const skyGeo = new THREE.PlaneGeometry(60, 40, 24, 24);
      const skyMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.glow),
        wireframe: dna.elements.includes('CYBER CITY') || dna.elements.includes('NEON'),
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
      this.skyMesh.position.set(0, 8, -25);
      this.skyMesh.rotation.x = -0.2;
      skyGroup.add(this.skyMesh);
    }

    // --- 3. Environment Layer (Monoliths, Cyber towers, or Crystal spires) ---
    const envGroup = this.layerGroups.get('Environment')!;
    if (elements.some(e => ['CYBER CITY', 'CRYSTAL', 'VOLCANO', 'MOUNTAIN', 'FOREST'].includes(e))) {
      const envMat = this.materialGenerator.getMaterial(dna.material, dna.colors);
      const envCount = quality.profile === 'LOW' ? 6 : quality.profile === 'MEDIUM' ? 12 : 18;

      for (let i = 0; i < envCount; i++) {
        let geo: THREE.BufferGeometry;
        if (elements.includes('CRYSTAL')) {
          geo = new THREE.OctahedronGeometry(1.2 + Math.random() * 1.5, 0);
        } else if (elements.includes('CYBER CITY')) {
          geo = new THREE.BoxGeometry(1.5, 6 + Math.random() * 8, 1.5);
        } else {
          geo = new THREE.ConeGeometry(2 + Math.random() * 2, 8 + Math.random() * 6, 5);
        }

        const mesh = new THREE.Mesh(geo, envMat);
        const angle = (i / envCount) * Math.PI * 2;
        const dist = 14 + Math.random() * 10;
        mesh.position.set(
          Math.cos(angle) * dist,
          elements.includes('CYBER CITY') ? -2 : -6 + Math.random() * 3,
          Math.sin(angle) * dist - 8
        );
        mesh.rotation.y = Math.random() * Math.PI;
        envGroup.add(mesh);
      }
    }

    // --- 4. Terrain Layer (Ocean waves, Cyber grid, or Lava floor) ---
    const terrainGroup = this.layerGroups.get('Terrain')!;
    if (elements.some(e => ['OCEAN', 'LAVA', 'CYBER CITY', 'FRACTAL', 'FOREST', 'MOUNTAIN'].includes(e))) {
      const segs = quality.profile === 'LOW' ? 24 : quality.profile === 'MEDIUM' ? 40 : 64;
      const terrainGeo = new THREE.PlaneGeometry(60, 60, segs, segs);
      terrainGeo.rotateX(-Math.PI / 2);

      let terrainMat: THREE.Material;
      if (elements.includes('LAVA')) {
        terrainMat = this.materialGenerator.getMaterial({ ...dna.material, type: 'lava' }, colors);
      } else if (elements.includes('OCEAN') || elements.includes('LIQUID GLASS')) {
        terrainMat = this.materialGenerator.getMaterial({ ...dna.material, type: 'liquid-style' }, colors);
      } else {
        terrainMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colors.secondary),
          wireframe: elements.includes('CYBER CITY') || elements.includes('NEON'),
          roughness: 0.3,
          metalness: 0.8,
        });
      }

      this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      this.terrainMesh.position.y = -8;
      terrainGroup.add(this.terrainMesh);
    }

    // --- 5. Main Object (Centerpiece: Black Hole, Energy Sphere, Crystal, Portal, Fractal) ---
    const mainGroup = this.layerGroups.get('Main Object')!;
    this.mainObjectMesh = new THREE.Group();
    const coreMat = this.materialGenerator.getMaterial(dna.material, colors);

    if (elements.includes('BLACK HOLE')) {
      // Event horizon core
      const coreGeo = new THREE.SphereGeometry(3.5, 32, 32);
      const blackHoleMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const core = new THREE.Mesh(coreGeo, blackHoleMat);
      this.mainObjectMesh.add(core);

      // Accretion disk
      const diskGeo = new THREE.RingGeometry(4.2, 9.5, 64);
      diskGeo.rotateX(Math.PI / 2);
      const diskMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.glow),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      this.mainObjectMesh.add(disk);
    } else if (elements.includes('PORTAL')) {
      const ringGeo = new THREE.TorusGeometry(4.5, 0.6, 24, 64);
      const ring = new THREE.Mesh(ringGeo, coreMat);
      this.mainObjectMesh.add(ring);

      const portalCoreGeo = new THREE.CircleGeometry(4.2, 32);
      const portalCoreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.primary),
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const portalCenter = new THREE.Mesh(portalCoreGeo, portalCoreMat);
      this.mainObjectMesh.add(portalCenter);
    } else if (elements.includes('CRYSTAL')) {
      const crystalGeo = new THREE.IcosahedronGeometry(4.0, 1);
      const crystal = new THREE.Mesh(crystalGeo, coreMat);
      this.mainObjectMesh.add(crystal);
    } else if (elements.includes('GALAXY')) {
      const galaxyCoreGeo = new THREE.SphereGeometry(2.5, 24, 24);
      const galaxyCore = new THREE.Mesh(galaxyCoreGeo, coreMat);
      this.mainObjectMesh.add(galaxyCore);
    } else {
      // Default Radiant Energy or Living World Sphere
      const sphereGeo = new THREE.SphereGeometry(3.6, 32, 32);
      const sphere = new THREE.Mesh(sphereGeo, coreMat);
      this.mainObjectMesh.add(sphere);
    }

    mainGroup.add(this.mainObjectMesh);

    // --- 6. Particles Layer (Physics, vortex, wind, precipitation) ---
    const partGroup = this.layerGroups.get('Particles')!;
    const maxParticles = quality.maxParticleCount || 10000;
    const densityMult = dna.physics.particleDensity || 1.0;
    this.particleCount = Math.floor(Math.min(maxParticles, 4000 * densityMult));

    const pGeo = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.particleCount * 3);
    this.particleVelocities = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const rad = 2 + Math.random() * 22;
      const angle = Math.random() * Math.PI * 2;
      this.particlePositions[i3] = Math.cos(angle) * rad;
      this.particlePositions[i3 + 1] = (Math.random() - 0.5) * 20;
      this.particlePositions[i3 + 2] = Math.sin(angle) * rad;

      this.particleVelocities[i3] = (Math.random() - 0.5) * 0.2;
      this.particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.2;
      this.particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color(colors.accent),
      size: (dna.physics.particleSize || 1.0) * (quality.profile === 'LOW' ? 1.4 : 1.0),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.particlesPoints = new THREE.Points(pGeo, pMat);
    partGroup.add(this.particlesPoints);

    // --- 7. Atmosphere (Glowing volumetric halo) ---
    const atmoGroup = this.layerGroups.get('Atmosphere')!;
    const atmoGeo = new THREE.SphereGeometry(18, 24, 24);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(colors.glow),
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.atmosphereMesh = new THREE.Mesh(atmoGeo, atmoMat);
    atmoGroup.add(this.atmosphereMesh);

    // --- 8. Lighting ---
    const lightGroup = this.layerGroups.get('Lighting')!;
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    lightGroup.add(this.ambientLight);

    this.primaryLight = new THREE.PointLight(new THREE.Color(colors.primary), 2.2, 60);
    this.primaryLight.position.set(10, 15, 12);
    lightGroup.add(this.primaryLight);

    this.secondaryLight = new THREE.PointLight(new THREE.Color(colors.glow), 1.8, 50);
    this.secondaryLight.position.set(-12, -8, 8);
    lightGroup.add(this.secondaryLight);

    // --- 10. Foreground Bokeh Particles ---
    const fgGroup = this.layerGroups.get('Foreground')!;
    this.foregroundCount = quality.profile === 'LOW' ? 60 : 150;
    const fgGeo = new THREE.BufferGeometry();
    const fgPos = new Float32Array(this.foregroundCount * 3);
    for (let i = 0; i < this.foregroundCount; i++) {
      const i3 = i * 3;
      fgPos[i3] = (Math.random() - 0.5) * 16;
      fgPos[i3 + 1] = (Math.random() - 0.5) * 16;
      fgPos[i3 + 2] = 12 + Math.random() * 8; // Near camera
    }
    fgGeo.setAttribute('position', new THREE.BufferAttribute(fgPos, 3));
    const fgMat = new THREE.PointsMaterial({
      color: new THREE.Color(colors.primary),
      size: 2.2,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.foregroundPoints = new THREE.Points(fgGeo, fgMat);
    fgGroup.add(this.foregroundPoints);
  }

  /**
   * Applies slider parameters (intensity, scale, speed, depth, opacity, visibility) incrementally
   */
  public applyLayerSettings(dna: DesignDNA): void {
    const layerTypes: LayerType[] = [
      'Background', 'Sky', 'Environment', 'Terrain', 'Main Object',
      'Particles', 'Atmosphere', 'Lighting', 'Effects', 'Foreground'
    ];

    layerTypes.forEach(name => {
      const group = this.layerGroups.get(name);
      const conf = dna.layers[name];
      if (group && conf) {
        group.visible = conf.enabled;
        group.scale.set(conf.scale, conf.scale, conf.scale);
        group.position.z = conf.depth;

        // Apply opacity to children where possible
        group.traverse(child => {
          if ((child as any).material) {
            const mat = (child as any).material;
            if (mat.opacity !== undefined) {
              mat.opacity = Math.min(1.0, conf.opacity * conf.intensity);
            }
          }
        });
      }
    });

    // Update particle point size incrementally
    if (this.particlesPoints && this.particlesPoints.material) {
      (this.particlesPoints.material as THREE.PointsMaterial).size = (dna.physics.particleSize || 1.0) * 1.2;
    }
  }

  /**
   * Real-time update for all layers, physics, fluid waves, rotation, audio reactivity
   */
  public update(delta: number, time: number, dna: DesignDNA, audioTargets?: any, inputPos?: { x: number; y: number }): void {
    // 1. Sky & Background rotation
    if (this.backgroundMesh) {
      const bgConf = dna.layers.Background;
      this.backgroundMesh.rotation.y = time * 0.02 * bgConf.speed;
    }
    if (this.skyMesh) {
      const skyConf = dna.layers.Sky;
      this.skyMesh.rotation.z = Math.sin(time * 0.2 * skyConf.speed) * 0.08;
    }

    // 2. Terrain wave simulation (fluid / ocean)
    if (this.terrainMesh && dna.layers.Terrain.enabled) {
      const geo = this.terrainMesh.geometry as THREE.BufferGeometry;
      const posAttr = geo.getAttribute('position');
      if (posAttr) {
        const count = posAttr.count;
        const waveSpeed = time * 1.5 * dna.layers.Terrain.speed;
        const amp = (dna.layers.Terrain.intensity || 1.0) * (audioTargets ? audioTargets.waveAmplitude * 0.8 : 0.4);

        for (let i = 0; i < count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          const y = Math.sin(x * 0.3 + waveSpeed) * Math.cos(z * 0.3 + waveSpeed) * amp;
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
      }
    }

    // 3. Main Object rotation & audio reaction
    if (this.mainObjectMesh && dna.layers['Main Object'].enabled) {
      const objConf = dna.layers['Main Object'];
      const baseSpeed = 0.4 * objConf.speed;
      this.mainObjectMesh.rotation.y += delta * baseSpeed;
      this.mainObjectMesh.rotation.x = Math.sin(time * 0.5) * 0.15;

      const scaleAudio = audioTargets ? audioTargets.particleScale : 1.0;
      const baseScale = objConf.scale * scaleAudio;
      this.mainObjectMesh.scale.set(baseScale, baseScale, baseScale);
    }

    // 4. Particles Physics (Gravity, Wind, Turbulence, Vortex, Attraction)
    if (this.particlesPoints && dna.layers.Particles.enabled) {
      const posAttr = this.particlesPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (posAttr) {
        const physics = dna.physics;
        const speedMult = physics.particleSpeed * dna.layers.Particles.speed;
        const grav = physics.gravity * 0.8;
        const wind = physics.wind * 0.8;
        const vortex = physics.vortexStrength;
        const attract = physics.attraction;

        const touchX = inputPos ? inputPos.x * 12 : 0;
        const touchY = inputPos ? inputPos.y * 12 : 0;

        for (let i = 0; i < this.particleCount; i++) {
          const i3 = i * 3;
          let px = this.particlePositions[i3];
          let py = this.particlePositions[i3 + 1];
          let pz = this.particlePositions[i3 + 2];

          // Gravity & Wind
          py -= grav * delta * 5.0;
          px += wind * delta * 5.0;

          // Vortex around center (0,0)
          if (vortex > 0.05) {
            const angle = Math.atan2(pz, px) + vortex * delta * 2.0;
            const dist = Math.sqrt(px * px + pz * pz);
            px = Math.cos(angle) * dist;
            pz = Math.sin(angle) * dist;
          }

          // Turbulence
          if (physics.turbulence > 0.05) {
            px += Math.sin(py * 0.5 + time) * physics.turbulence * delta;
            pz += Math.cos(px * 0.5 + time) * physics.turbulence * delta;
          }

          // Touch Attraction / Repulsion
          if (inputPos && attract > 0.1) {
            const dx = touchX - px;
            const dy = touchY - py;
            px += dx * delta * attract * 0.8;
            py += dy * delta * attract * 0.8;
          }

          // Boundary wrap
          if (py < -15) py = 15;
          if (py > 15) py = -15;
          if (px < -25) px = 25;
          if (px > 25) px = -25;
          if (pz < -25) pz = 25;
          if (pz > 25) pz = -25;

          this.particlePositions[i3] = px;
          this.particlePositions[i3 + 1] = py;
          this.particlePositions[i3 + 2] = pz;
        }

        posAttr.copyArray(this.particlePositions);
        posAttr.needsUpdate = true;
      }
    }

    // 5. Atmosphere breathing
    if (this.atmosphereMesh && dna.layers.Atmosphere.enabled) {
      const breath = 1.0 + Math.sin(time * 1.5) * 0.05;
      this.atmosphereMesh.scale.set(breath, breath, breath);
    }

    // 6. Foreground floating bokeh
    if (this.foregroundPoints && dna.layers.Foreground.enabled) {
      const fgAttr = this.foregroundPoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      if (fgAttr) {
        for (let i = 0; i < this.foregroundCount; i++) {
          let y = fgAttr.getY(i) - delta * 0.5;
          if (y < -8) y = 8;
          fgAttr.setY(i, y);
        }
        fgAttr.needsUpdate = true;
      }
    }
  }

  public dispose(): void {
    this.layerGroups.forEach(g => {
      while (g.children.length > 0) {
        const obj = g.children[0];
        g.remove(obj);
        if ((obj as any).geometry) (obj as any).geometry.dispose();
      }
    });
    this.materialGenerator.dispose();
  }
}
