import * as THREE from 'three';
import { PRNG } from '../seed/PRNG';
import { StructuresDNA } from '../types/environmentDNA';
import { QualityConfig } from '../../types/engine';

export class FractalOrganicBuilder {
  public static build(dna: StructuresDNA, prng: PRNG, quality: QualityConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = 'EnvironmentFractals';

    if (dna.type === 'portals') {
      this.buildTimeTunnelPortals(group, dna, prng, quality);
    } else if (dna.type === 'organic-cells') {
      this.buildOrganicMicroClusters(group, dna, prng, quality);
    } else {
      this.buildRecursiveFractalStructures(group, dna, prng, quality);
    }

    return group;
  }

  private static buildTimeTunnelPortals(group: THREE.Group, dna: StructuresDNA, prng: PRNG, quality: QualityConfig) {
    const ringCount = quality.profile === 'LOW' ? 12 : quality.profile === 'MEDIUM' ? 20 : 30;
    const colA = new THREE.Color(dna.color || '#ff007f');
    const colB = new THREE.Color(dna.neonGlowColor || '#00f0ff');

    for (let i = 0; i < ringCount; i++) {
      const radius = 2.2 + Math.sin(i * 0.4) * 0.8;
      const geo = new THREE.TorusGeometry(radius, 0.04, 8, 32);
      const factor = i / ringCount;
      const ringCol = colA.clone().lerp(colB, factor);

      const mat = new THREE.MeshBasicMaterial({
        color: ringCol,
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = -15 + i * 1.5;
      mesh.rotation.z = i * 0.2;
      mesh.userData = {
        spinSpeed: (i % 2 === 0 ? 1 : -1) * prng.range(0.3, 0.8),
        baseZ: mesh.position.z
      };

      group.add(mesh);
    }
  }

  private static buildOrganicMicroClusters(group: THREE.Group, dna: StructuresDNA, prng: PRNG, quality: QualityConfig) {
    const clusterCount = quality.profile === 'LOW' ? 16 : quality.profile === 'MEDIUM' ? 30 : 50;
    const cellMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dna.color || '#9d4edd'),
      emissive: new THREE.Color(dna.secondaryColor || '#240046'),
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.3,
      flatShading: true
    });

    for (let i = 0; i < clusterCount; i++) {
      const radius = prng.range(0.3, 0.9);
      const geo = new THREE.IcosahedronGeometry(radius, 1);
      const mesh = new THREE.Mesh(geo, cellMat);

      mesh.position.set(
        prng.range(-10, 10),
        prng.range(1.0, 7.0),
        prng.range(-10, 10)
      );

      mesh.userData = {
        pulseSpeed: prng.range(1.5, 3.5),
        pulseScale: prng.range(0.15, 0.35),
        floatSpeed: prng.range(0.5, 1.2),
        initialY: mesh.position.y
      };

      group.add(mesh);
    }
  }

  private static buildRecursiveFractalStructures(group: THREE.Group, dna: StructuresDNA, prng: PRNG, quality: QualityConfig) {
    const count = quality.profile === 'LOW' ? 10 : quality.profile === 'MEDIUM' ? 18 : 28;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(dna.neonGlowColor || '#00ffcc'),
      wireframe: true
    });

    for (let i = 0; i < count; i++) {
      const parent = new THREE.Group();
      const geo = new THREE.OctahedronGeometry(prng.range(0.8, 1.6), 0);
      const mesh = new THREE.Mesh(geo, mat);
      parent.add(mesh);

      // Child sub-octahedrons
      for (let c = 0; c < 4; c++) {
        const childGeo = new THREE.OctahedronGeometry(0.3, 0);
        const childMesh = new THREE.Mesh(childGeo, mat);
        const angle = (c * Math.PI) / 2;
        childMesh.position.set(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0);
        parent.add(childMesh);
      }

      parent.position.set(
        prng.range(-11, 11),
        prng.range(1.5, 6.5),
        prng.range(-11, 11)
      );

      parent.userData = {
        rotX: prng.range(0.2, 0.8),
        rotY: prng.range(0.2, 0.8),
        rotZ: prng.range(0.1, 0.4)
      };

      group.add(parent);
    }
  }

  public static update(group: THREE.Group, time: number, delta: number) {
    for (const child of group.children) {
      if (child.userData) {
        if (child.userData.spinSpeed !== undefined) {
          child.rotation.z += delta * child.userData.spinSpeed;
          // Loop tunnel z positions for infinite zoom illusion
          let z = child.position.z + delta * 3.0;
          if (z > 5) z = -20;
          child.position.z = z;
        } else if (child.userData.pulseSpeed !== undefined) {
          const s = 1.0 + Math.sin(time * child.userData.pulseSpeed) * child.userData.pulseScale;
          child.scale.set(s, s, s);
          child.position.y = child.userData.initialY + Math.cos(time * child.userData.floatSpeed) * 0.4;
        } else if (child.userData.rotX !== undefined) {
          child.rotation.x += delta * child.userData.rotX;
          child.rotation.y += delta * child.userData.rotY;
        }
      }
    }
  }
}
