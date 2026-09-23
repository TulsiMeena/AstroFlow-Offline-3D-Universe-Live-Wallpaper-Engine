import * as THREE from 'three';
import { ZoomScaleLevel, FusionDNA } from '../types/infiniteTypes';

export class InfiniteZoomEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dna: FusionDNA;

  private currentLevel: ZoomScaleLevel = 'environment';
  private targetLevel: ZoomScaleLevel = 'environment';
  private zoomProgress: number = 1.0; // 0 to 1 transition progress

  // Representation Groups
  private zoomRootGroup: THREE.Group = new THREE.Group();
  private microGroup: THREE.Group = new THREE.Group();
  private objectGroup: THREE.Group = new THREE.Group();
  private planetGroup: THREE.Group = new THREE.Group();
  private solarGroup: THREE.Group = new THREE.Group();
  private galaxyGroup: THREE.Group = new THREE.Group();
  private universeGroup: THREE.Group = new THREE.Group();

  private readonly levelsOrder: ZoomScaleLevel[] = [
    'micro',
    'object',
    'environment',
    'planet',
    'solar-system',
    'galaxy',
    'universe'
  ];

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, dna: FusionDNA) {
    this.scene = scene;
    this.camera = camera;
    this.dna = dna;

    this.zoomRootGroup.name = 'InfiniteZoomRoot';
    this.scene.add(this.zoomRootGroup);

    this.zoomRootGroup.add(this.microGroup);
    this.zoomRootGroup.add(this.objectGroup);
    this.zoomRootGroup.add(this.planetGroup);
    this.zoomRootGroup.add(this.solarGroup);
    this.zoomRootGroup.add(this.galaxyGroup);
    this.zoomRootGroup.add(this.universeGroup);

    this.buildProceduralScenes();
    this.updateVisibility();
  }

  public setDNA(dna: FusionDNA): void {
    this.dna = dna;
    this.rebuildProceduralScenes();
  }

  private rebuildProceduralScenes(): void {
    this.cleanGroup(this.microGroup);
    this.cleanGroup(this.objectGroup);
    this.cleanGroup(this.planetGroup);
    this.cleanGroup(this.solarGroup);
    this.cleanGroup(this.galaxyGroup);
    this.cleanGroup(this.universeGroup);
    this.buildProceduralScenes();
    this.updateVisibility();
  }

  private buildProceduralScenes(): void {
    const colA = new THREE.Color(this.dna.primaryColor);
    const colB = new THREE.Color(this.dna.secondaryColor);
    const colAccent = new THREE.Color(this.dna.accentColor);

    // 1. Micro Scale: Quantum Lattice Nodes
    const microNodeCount = 64;
    const microPositions = new Float32Array(microNodeCount * 3);
    for (let i = 0; i < microNodeCount; i++) {
      const idx = i;
      const x = ((idx % 4) - 1.5) * 1.5;
      const y = ((Math.floor(idx / 4) % 4) - 1.5) * 1.5;
      const z = (Math.floor(idx / 16) - 1.5) * 1.5;
      microPositions[i * 3] = x;
      microPositions[i * 3 + 1] = y + 10;
      microPositions[i * 3 + 2] = z - 10;
    }
    const microGeo = new THREE.BufferGeometry();
    microGeo.setAttribute('position', new THREE.BufferAttribute(microPositions, 3));
    const microMat = new THREE.PointsMaterial({
      size: 0.8,
      color: colAccent,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.85
    });
    this.microGroup.add(new THREE.Points(microGeo, microMat));

    // 2. Object Scale: Resonating Dimensional Relic
    const relicGeo = new THREE.IcosahedronGeometry(2.5, 0);
    const relicMat = new THREE.MeshStandardMaterial({
      color: colB,
      emissive: colAccent,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.1,
      wireframe: true
    });
    const relic = new THREE.Mesh(relicGeo, relicMat);
    relic.position.set(0, 10, -12);
    this.objectGroup.add(relic);

    // 3. Planet Scale: Exoplanet Globe
    const globeGeo = new THREE.SphereGeometry(20, 32, 32);
    const globeMat = new THREE.MeshStandardMaterial({
      color: colA,
      emissive: colB,
      emissiveIntensity: 0.3,
      roughness: 0.6
    });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    globe.position.set(0, 10, -70);

    const ringGeo = new THREE.RingGeometry(24, 38, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colAccent,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    globe.add(ring);
    this.planetGroup.add(globe);

    // 4. Solar System Scale: Central Star & Orbits
    const starGeo = new THREE.SphereGeometry(15, 24, 24);
    const starMat = new THREE.MeshBasicMaterial({ color: colAccent });
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, 10, -140);

    for (let p = 1; p <= 4; p++) {
      const pOrb = 25 + p * 20;
      const oGeo = new THREE.RingGeometry(pOrb - 0.2, pOrb + 0.2, 48);
      const oMat = new THREE.MeshBasicMaterial({
        color: colB,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const oMesh = new THREE.Mesh(oGeo, oMat);
      oMesh.rotation.x = Math.PI / 2;
      star.add(oMesh);

      const pGeo = new THREE.SphereGeometry(1.8 + p * 0.4, 16, 16);
      const pMat = new THREE.MeshStandardMaterial({ color: colAccent });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(pOrb, 0, 0);
      star.add(pMesh);
    }
    this.solarGroup.add(star);

    // 5. Galaxy Scale: Spiral Galaxy Disk
    const gCount = 800;
    const gPos = new Float32Array(gCount * 3);
    const gCols = new Float32Array(gCount * 3);
    for (let i = 0; i < gCount; i++) {
      const arm = i % 2;
      const t = (i / gCount) * Math.PI * 6;
      const r = 5 + Math.pow(i / gCount, 0.7) * 90;
      const angle = t + (arm * Math.PI);
      gPos[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 8;
      gPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      gPos[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 8;

      const c = Math.random() > 0.5 ? colB : colAccent;
      gCols[i * 3] = c.r;
      gCols[i * 3 + 1] = c.g;
      gCols[i * 3 + 2] = c.b;
    }
    const gGeo = new THREE.BufferGeometry();
    gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3));
    gGeo.setAttribute('color', new THREE.BufferAttribute(gCols, 3));
    const gMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const gal = new THREE.Points(gGeo, gMat);
    gal.position.set(0, 10, -200);
    this.galaxyGroup.add(gal);

    // 6. Universe Scale: Cosmic Web Filaments
    const uCount = 1200;
    const uPos = new Float32Array(uCount * 3);
    const uCols = new Float32Array(uCount * 3);
    for (let i = 0; i < uCount; i++) {
      uPos[i * 3] = (Math.random() - 0.5) * 400;
      uPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
      uPos[i * 3 + 2] = -250 + (Math.random() - 0.5) * 200;

      const c = Math.random() > 0.6 ? colAccent : colB;
      uCols[i * 3] = c.r;
      uCols[i * 3 + 1] = c.g;
      uCols[i * 3 + 2] = c.b;
    }
    const uGeo = new THREE.BufferGeometry();
    uGeo.setAttribute('position', new THREE.BufferAttribute(uPos, 3));
    uGeo.setAttribute('color', new THREE.BufferAttribute(uCols, 3));
    const uMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const uni = new THREE.Points(uGeo, uMat);
    this.universeGroup.add(uni);
  }

  private updateVisibility(): void {
    const lvl = this.targetLevel;
    this.microGroup.visible = lvl === 'micro';
    this.objectGroup.visible = lvl === 'object';
    this.planetGroup.visible = lvl === 'planet';
    this.solarGroup.visible = lvl === 'solar-system';
    this.galaxyGroup.visible = lvl === 'galaxy';
    this.universeGroup.visible = lvl === 'universe';
  }

  public getCurrentLevel(): ZoomScaleLevel {
    return this.targetLevel;
  }

  public setZoomLevel(level: ZoomScaleLevel): void {
    this.currentLevel = this.targetLevel;
    this.targetLevel = level;
    this.zoomProgress = 0.0;
    this.updateVisibility();
  }

  /**
   * Zoom In: transitions inward (Universe -> Galaxy -> ... -> Micro)
   */
  public zoomIn(): ZoomScaleLevel {
    const idx = this.levelsOrder.indexOf(this.targetLevel);
    if (idx > 0) {
      this.setZoomLevel(this.levelsOrder[idx - 1]);
    }
    return this.targetLevel;
  }

  /**
   * Zoom Out: transitions outward (Micro -> Object -> ... -> Universe)
   */
  public zoomOut(): ZoomScaleLevel {
    const idx = this.levelsOrder.indexOf(this.targetLevel);
    if (idx < this.levelsOrder.length - 1) {
      this.setZoomLevel(this.levelsOrder[idx + 1]);
    }
    return this.targetLevel;
  }

  /**
   * Cycle next zoom level
   */
  public cycleZoom(): ZoomScaleLevel {
    const idx = this.levelsOrder.indexOf(this.targetLevel);
    const nextIdx = (idx + 1) % this.levelsOrder.length;
    this.setZoomLevel(this.levelsOrder[nextIdx]);
    return this.targetLevel;
  }

  public update(time: number, delta: number): void {
    if (this.zoomProgress < 1.0) {
      this.zoomProgress = Math.min(this.zoomProgress + delta * 2.0, 1.0);
    }

    // Gentle rotation animations on non-environment scale representations
    this.microGroup.rotation.y = time * 0.2;
    this.objectGroup.rotation.x = time * 0.3;
    this.objectGroup.rotation.y = time * 0.4;
    this.planetGroup.rotation.y = time * 0.1;
    this.solarGroup.rotation.y = time * 0.05;
    this.galaxyGroup.rotation.y = time * 0.03;
    this.universeGroup.rotation.z = time * 0.01;
  }

  private cleanGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        if (obj.geometry) obj.geometry.dispose();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else if (obj.material) obj.material.dispose();
      }
    }
  }

  public dispose(): void {
    this.cleanGroup(this.zoomRootGroup);
    this.scene.remove(this.zoomRootGroup);
  }
}
