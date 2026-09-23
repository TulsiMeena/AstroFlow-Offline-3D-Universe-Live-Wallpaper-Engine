import * as THREE from 'three';
import { PRNG } from '../seed/PRNG';
import { StructuresDNA } from '../types/environmentDNA';
import { QualityConfig } from '../../types/engine';

export class CrystalBuilder {
  public static build(dna: StructuresDNA, prng: PRNG, quality: QualityConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = 'EnvironmentCrystals';

    const crystalCount = Math.floor((quality.profile === 'LOW' ? 20 : quality.profile === 'MEDIUM' ? 36 : 60) * dna.density);

    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(dna.color || '#00e5ff'),
      emissive: new THREE.Color(dna.neonGlowColor || '#1a0033'),
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7, // glass-like transmission
      ior: 1.5,
      transparent: true,
      opacity: 0.85,
      flatShading: true
    });

    const innerMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(dna.neonGlowColor || '#ff00ea'),
      wireframe: true
    });

    for (let i = 0; i < crystalCount; i++) {
      const cluster = new THREE.Group();
      const height = prng.range(1.5, 4.5) * (dna.scale || 1.0);
      const radius = prng.range(0.2, 0.6);

      const geo = new THREE.CylinderGeometry(0.01, radius, height, 6);
      const mesh = new THREE.Mesh(geo, crystalMat);
      mesh.position.y = height / 2;
      mesh.castShadow = true;
      cluster.add(mesh);

      // Inner glowing core
      const innerGeo = new THREE.OctahedronGeometry(radius * 0.7, 0);
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.position.y = height * 0.5;
      cluster.add(innerMesh);

      cluster.position.set(
        prng.range(-12, 12),
        0,
        prng.range(-12, 12)
      );

      // Slight tilt
      cluster.rotation.set(
        prng.range(-0.25, 0.25),
        prng.range(0, Math.PI * 2),
        prng.range(-0.25, 0.25)
      );

      cluster.userData = {
        pulseSpeed: prng.range(1.0, 2.5),
        pulseOffset: prng.range(0, Math.PI * 2)
      };

      group.add(cluster);
    }

    // Floating crystal fragments in air
    this.buildFloatingShards(group, dna, prng, quality);

    return group;
  }

  private static buildFloatingShards(group: THREE.Group, dna: StructuresDNA, prng: PRNG, quality: QualityConfig) {
    const shardCount = quality.profile === 'LOW' ? 24 : quality.profile === 'MEDIUM' ? 50 : 90;
    const shardGeo = new THREE.TetrahedronGeometry(0.25, 0);
    const shardMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(dna.secondaryColor || '#00ffff'),
      wireframe: true
    });

    for (let i = 0; i < shardCount; i++) {
      const mesh = new THREE.Mesh(shardGeo, shardMat);
      mesh.position.set(
        prng.range(-10, 10),
        prng.range(1.5, 7.0),
        prng.range(-10, 10)
      );
      mesh.rotation.set(prng.range(0, Math.PI), prng.range(0, Math.PI), 0);
      mesh.scale.setScalar(prng.range(0.4, 1.2));
      mesh.userData = {
        rotX: prng.range(0.5, 1.5),
        rotY: prng.range(0.5, 1.5),
        baseY: mesh.position.y,
        floatSpeed: prng.range(1.0, 2.0)
      };
      group.add(mesh);
    }
  }

  public static update(group: THREE.Group, time: number, delta: number) {
    for (const child of group.children) {
      if (child.userData && child.userData.rotX !== undefined) {
        // Floating shard
        child.rotation.x += delta * child.userData.rotX;
        child.rotation.y += delta * child.userData.rotY;
        child.position.y = child.userData.baseY + Math.sin(time * child.userData.floatSpeed) * 0.35;
      } else if (child.userData && child.userData.pulseSpeed !== undefined) {
        // Core pulse
        const s = 1.0 + Math.sin(time * child.userData.pulseSpeed + child.userData.pulseOffset) * 0.05;
        child.scale.set(s, s, s);
      }
    }
  }
}
