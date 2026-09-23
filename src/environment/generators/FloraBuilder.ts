import * as THREE from 'three';
import { PRNG } from '../seed/PRNG';
import { StructuresDNA } from '../types/environmentDNA';
import { QualityConfig } from '../../types/engine';

export class FloraBuilder {
  public static build(structuresDNA: StructuresDNA, prng: PRNG, quality: QualityConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = 'EnvironmentFlora';

    if (structuresDNA.type === 'bamboo') {
      this.buildBambooForest(group, structuresDNA, prng, quality);
    } else if (structuresDNA.type === 'trees') {
      this.buildLivingForest(group, structuresDNA, prng, quality);
    }

    return group;
  }

  private static buildLivingForest(group: THREE.Group, dna: StructuresDNA, prng: PRNG, quality: QualityConfig) {
    const treeCount = Math.floor((quality.profile === 'LOW' ? 24 : quality.profile === 'MEDIUM' ? 50 : 80) * dna.density);

    const trunkGeo = new THREE.CylinderGeometry(0.12, 0.22, 1.8, 6);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.9,
      flatShading: true
    });

    const foliageGeo = new THREE.ConeGeometry(1.1, 2.2, 6);
    const foliageMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dna.color || '#2d7a3a'),
      roughness: 0.8,
      flatShading: true
    });

    for (let i = 0; i < treeCount; i++) {
      const tree = new THREE.Group();

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.9;
      trunk.castShadow = true;
      tree.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 2.4;
      foliage.castShadow = true;
      tree.add(foliage);

      const scale = prng.range(0.6, 1.4) * (dna.scale || 1.0);
      tree.scale.set(scale, scale, scale);

      tree.position.set(
        prng.range(-13, 13),
        0,
        prng.range(-13, 13)
      );

      tree.rotation.y = prng.range(0, Math.PI * 2);
      tree.userData = {
        swayPhase: prng.range(0, Math.PI * 2),
        swaySpeed: prng.range(1.2, 2.0)
      };

      group.add(tree);
    }

    // Add falling leaves
    this.buildFallingLeaves(group, dna, prng, quality);
  }

  private static buildBambooForest(group: THREE.Group, dna: StructuresDNA, prng: PRNG, quality: QualityConfig) {
    const stalkCount = Math.floor((quality.profile === 'LOW' ? 40 : quality.profile === 'MEDIUM' ? 80 : 140) * dna.density);

    const stalkGeo = new THREE.CylinderGeometry(0.06, 0.08, 6.0, 6);
    const stalkMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dna.color || '#3eb44b'),
      roughness: 0.5,
      flatShading: true
    });

    for (let i = 0; i < stalkCount; i++) {
      const mesh = new THREE.Mesh(stalkGeo, stalkMat);
      mesh.position.set(
        prng.range(-12, 12),
        3.0,
        prng.range(-12, 12)
      );
      mesh.rotation.y = prng.range(0, Math.PI);
      mesh.rotation.z = prng.range(-0.04, 0.04);
      mesh.scale.set(1, prng.range(0.7, 1.4), 1);
      mesh.userData = {
        swayPhase: prng.range(0, Math.PI * 2),
        swaySpeed: prng.range(1.0, 1.8)
      };
      group.add(mesh);
    }
  }

  private static buildFallingLeaves(group: THREE.Group, dna: StructuresDNA, prng: PRNG, quality: QualityConfig) {
    const count = quality.profile === 'LOW' ? 100 : quality.profile === 'MEDIUM' ? 220 : 400;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const c1 = new THREE.Color(dna.color || '#3eb44b');
    const c2 = new THREE.Color(dna.secondaryColor || '#ff9d00');
    const temp = new THREE.Color();

    for (let i = 0; i < count; i++) {
      pos[i * 3] = prng.range(-12, 12);
      pos[i * 3 + 1] = prng.range(0.2, 7.0);
      pos[i * 3 + 2] = prng.range(-12, 12);

      temp.copy(c1).lerp(c2, prng.next());
      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });

    const leaves = new THREE.Points(geo, mat);
    leaves.name = 'FallingLeaves';
    group.add(leaves);
  }

  public static update(group: THREE.Group, time: number, delta: number, windStrength: number = 1.0) {
    // Sway trees & bamboo stalks
    for (const child of group.children) {
      if (child.userData && child.userData.swayPhase !== undefined) {
        const phase = child.userData.swayPhase;
        const speed = child.userData.swaySpeed;
        child.rotation.z = Math.sin(time * speed + phase) * 0.05 * windStrength;
        child.rotation.x = Math.cos(time * speed * 0.8 + phase) * 0.03 * windStrength;
      }
    }

    // Falling leaves physics
    const leaves = group.getObjectByName('FallingLeaves') as THREE.Points;
    if (leaves) {
      const pos = leaves.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - delta * 0.8;
        let x = pos.getX(i) + Math.sin(time * 2 + i) * 0.02 * windStrength;
        if (y < 0.1) {
          y = 7.0;
        }
        pos.setY(i, y);
        pos.setX(i, x);
      }
      pos.needsUpdate = true;
    }
  }
}
