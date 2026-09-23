import * as THREE from 'three';
import {
  PortalData,
  PortalType,
  WorldTransitionType,
  WorldTransitionState,
  FusionDNA
} from '../types/infiniteTypes';
import { FusionDNAFactory } from '../dna/FusionDNA';

export class PortalTransitionSystem {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private portals: Map<string, PortalData> = new Map();
  private portalGroup: THREE.Group = new THREE.Group();

  // Transition State
  private transitionState: WorldTransitionState = {
    isActive: false,
    type: 'portal',
    progress: 0,
    duration: 1.2,
    elapsed: 0,
    startWorldDNA: null,
    targetWorldDNA: null
  };

  // Visual Overlay for Cinematic Transitions
  private overlayMesh: THREE.Mesh | null = null;
  private overlayMat: THREE.ShaderMaterial | null = null;

  // History for Exit World
  private worldHistory: FusionDNA[] = [];

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene;
    this.camera = camera;
    this.portalGroup.name = 'PortalTransitionGroup';
    this.scene.add(this.portalGroup);

    this.buildTransitionOverlay();
  }

  private buildTransitionOverlay(): void {
    const geo = new THREE.PlaneGeometry(2, 2);
    this.overlayMat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        progress: { value: 0.0 },
        typeIndex: { value: 0.0 },
        time: { value: 0.0 },
        colorA: { value: new THREE.Color('#00F0FF') },
        colorB: { value: new THREE.Color('#7000FF') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float progress;
        uniform float typeIndex;
        uniform float time;
        uniform vec3 colorA;
        uniform vec3 colorB;
        varying vec2 vUv;

        void main() {
          if (progress <= 0.001) {
            discard;
          }

          vec2 uv = vUv - 0.5;
          float dist = length(uv);
          float alpha = 0.0;
          vec3 col = mix(colorA, colorB, 0.5 + 0.5 * sin(time * 4.0));

          // 0: Portal / Vortex
          if (typeIndex < 0.5) {
            float swirl = atan(uv.y, uv.x) * 3.0 + dist * 10.0 - time * 6.0;
            float pattern = sin(swirl);
            alpha = smoothstep(1.0 - progress * 1.5, 1.0, 1.0 - dist) * (0.6 + 0.4 * pattern);
            col = mix(col, vec3(1.0), pattern * 0.4);
          }
          // 1: Warp / Tunnel
          else if (typeIndex < 1.5) {
            float rings = sin(dist * 30.0 - time * 12.0);
            alpha = min(progress * 2.0, 2.0 - progress * 2.0) * (0.7 + 0.3 * rings);
            col += vec3(0.2, 0.4, 0.9);
          }
          // 2: Black Hole Gravitational Collapse
          else if (typeIndex < 2.5) {
            float eventHorizon = progress * 0.7;
            if (dist < eventHorizon) {
              alpha = 1.0;
              col = vec3(0.0);
            } else {
              float glow = smoothstep(eventHorizon + 0.2, eventHorizon, dist);
              alpha = glow * 0.9;
              col = vec3(1.0, 0.4, 0.0);
            }
          }
          // 3: Energy Wave / Dissolve
          else {
            float wave = sin(vUv.x * 20.0 + time * 8.0) * cos(vUv.y * 20.0 + time * 8.0);
            alpha = min(progress * 2.0, 2.0 - progress * 2.0) * (0.8 + 0.2 * wave);
          }

          alpha = clamp(alpha, 0.0, 1.0);
          gl_FragColor = vec4(col, alpha);
        }
      `
    });

    const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.overlayMesh = new THREE.Mesh(geo, this.overlayMat);
    this.overlayMesh.renderOrder = 9999;
    this.camera.add(this.overlayMesh);
    this.overlayMesh.position.set(0, 0, -0.1);
  }

  /**
   * Spawns a procedural 3D portal
   */
  public createPortal(
    id: string,
    name: string,
    type: PortalType,
    position: THREE.Vector3,
    targetSeed: number,
    targetPrimary: any = 'ocean',
    targetSecondary: any = 'aurora'
  ): PortalData {
    // Remove existing if any
    this.removePortal(id);

    const group = new THREE.Group();
    group.name = `Portal_${id}`;
    group.position.copy(position);

    const colors = FusionDNAFactory.getSystemColors(targetPrimary);

    // Geometry based on PortalType
    if (type === 'energy') {
      // Outer Torus Ring
      const ringGeo = new THREE.TorusGeometry(5, 0.4, 16, 32);
      const ringMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(colors.accent),
        emissive: new THREE.Color(colors.secondary),
        emissiveIntensity: 0.8,
        metalness: 0.9,
        roughness: 0.1
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);

      // Inner Glowing Event Disk
      const diskGeo = new THREE.CircleGeometry(4.8, 32);
      const diskMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.accent),
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const disk = new THREE.Mesh(diskGeo, diskMat);
      group.add(disk);
    } else if (type === 'black-hole') {
      // Singularity core + rotating accretion ring
      const coreGeo = new THREE.SphereGeometry(3.5, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      const accGeo = new THREE.RingGeometry(4.2, 7.5, 32);
      const accMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FF5500'),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });
      const acc = new THREE.Mesh(accGeo, accMat);
      acc.rotation.x = Math.PI / 3;
      group.add(acc);
    } else if (type === 'crystal') {
      // Floating crystal shards around center
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const cGeo = new THREE.OctahedronGeometry(1.2, 0);
        cGeo.scale(0.8, 2.2, 0.8);
        const cMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(colors.accent),
          emissive: new THREE.Color(colors.secondary),
          emissiveIntensity: 0.7,
          metalness: 0.9,
          roughness: 0.1,
          transparent: true,
          opacity: 0.85
        });
        const crystal = new THREE.Mesh(cGeo, cMat);
        crystal.position.set(Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, 0);
        crystal.rotation.z = angle;
        group.add(crystal);
      }
    } else if (type === 'holographic') {
      // Cyber Archway
      const archGeo = new THREE.BoxGeometry(7, 9, 0.5);
      const archMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.accent),
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const arch = new THREE.Mesh(archGeo, archMat);
      group.add(arch);
    } else {
      // Wormhole Funnel Vortex
      const coneGeo = new THREE.ConeGeometry(5, 8, 24, 1, true);
      coneGeo.rotateX(Math.PI / 2);
      const coneMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.accent),
        wireframe: true,
        transparent: true,
        opacity: 0.6
      });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      group.add(cone);
    }

    // Swirling Portal Particle Halo
    const pCount = 80;
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 3 + Math.random() * 3.5;
      pPos[i * 3] = Math.cos(theta) * r;
      pPos[i * 3 + 1] = Math.sin(theta) * r;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      size: 0.4,
      color: new THREE.Color(colors.accent),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(pGeo, pMat);
    group.add(particles);

    // Local Glow Light
    const light = new THREE.PointLight(new THREE.Color(colors.accent), 2.5, 25);
    group.add(light);

    this.portalGroup.add(group);

    const portalData: PortalData = {
      id,
      name,
      type,
      position,
      targetSeed,
      targetPrimarySystem: targetPrimary,
      targetSecondarySystem: targetSecondary,
      radius: 6.0,
      active: true,
      group
    };

    this.portals.set(id, portalData);
    return portalData;
  }

  public removePortal(id: string): void {
    const p = this.portals.get(id);
    if (!p) return;
    if (p.group) {
      this.portalGroup.remove(p.group);
      p.group.traverse((c) => {
        if (c instanceof THREE.Mesh || c instanceof THREE.Points) {
          c.geometry.dispose();
          if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
          else c.material.dispose();
        }
      });
    }
    this.portals.delete(id);
  }

  public getPortals(): PortalData[] {
    return Array.from(this.portals.values());
  }

  /**
   * Cinematic World Transition Sequence
   */
  public triggerTransition(
    type: WorldTransitionType,
    targetDNA: FusionDNA,
    currentDNA: FusionDNA,
    onSwitchWorld: (newDNA: FusionDNA) => void,
    duration: number = 1.2
  ): void {
    this.worldHistory.push(currentDNA);

    let typeIndex = 0;
    if (type === 'portal') typeIndex = 0;
    else if (type === 'warp' || type === 'tunnel') typeIndex = 1;
    else if (type === 'black-hole') typeIndex = 2;
    else typeIndex = 3;

    if (this.overlayMat) {
      this.overlayMat.uniforms.typeIndex.value = typeIndex;
      this.overlayMat.uniforms.colorA.value.set(currentDNA.accentColor);
      this.overlayMat.uniforms.colorB.value.set(targetDNA.accentColor);
    }

    this.transitionState = {
      isActive: true,
      type,
      progress: 0,
      duration,
      elapsed: 0,
      startWorldDNA: currentDNA,
      targetWorldDNA: targetDNA,
      onComplete: () => {
        onSwitchWorld(targetDNA);
      }
    };
  }

  /**
   * Exit World - returns to previous world
   */
  public exitWorld(
    currentDNA: FusionDNA,
    onSwitchWorld: (dna: FusionDNA) => void
  ): boolean {
    if (this.worldHistory.length === 0) return false;
    const prev = this.worldHistory.pop()!;
    this.triggerTransition('portal', prev, currentDNA, onSwitchWorld, 1.0);
    return true;
  }

  /**
   * Random World - generates and warps to random world
   */
  public randomWorld(
    currentDNA: FusionDNA,
    onSwitchWorld: (dna: FusionDNA) => void
  ): FusionDNA {
    const nextSeed = Math.floor(Math.random() * 999999);
    const newDNA = FusionDNAFactory.createRandom(nextSeed);
    this.triggerTransition('warp', newDNA, currentDNA, onSwitchWorld, 1.2);
    return newDNA;
  }

  /**
   * Frame update
   */
  public update(time: number, delta: number): void {
    // Animate portals
    this.portals.forEach((p) => {
      if (p.group) {
        p.group.rotation.z = time * 0.4;
        p.group.rotation.y = Math.sin(time * 0.5) * 0.2;
      }
    });

    // Update transition progress
    if (this.transitionState.isActive) {
      this.transitionState.elapsed += delta;
      const progress = Math.min(
        this.transitionState.elapsed / this.transitionState.duration,
        1.0
      );
      this.transitionState.progress = progress;

      if (this.overlayMat) {
        this.overlayMat.uniforms.progress.value = progress;
        this.overlayMat.uniforms.time.value = time;
      }

      // World swap happens at midpoint (progress 0.5)
      if (progress >= 0.5 && this.transitionState.onComplete) {
        this.transitionState.onComplete();
        this.transitionState.onComplete = undefined;
      }

      if (progress >= 1.0) {
        this.transitionState.isActive = false;
        if (this.overlayMat) {
          this.overlayMat.uniforms.progress.value = 0.0;
        }
      }
    }
  }

  public isTransitionActive(): boolean {
    return this.transitionState.isActive;
  }

  public dispose(): void {
    this.portals.forEach((p) => this.removePortal(p.id));
    this.scene.remove(this.portalGroup);
    if (this.overlayMesh) {
      this.camera.remove(this.overlayMesh);
      this.overlayMesh.geometry.dispose();
      if (this.overlayMat) this.overlayMat.dispose();
    }
  }
}
