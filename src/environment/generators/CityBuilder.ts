import * as THREE from 'three';
import { PRNG } from '../seed/PRNG';
import { StructuresDNA } from '../types/environmentDNA';
import { QualityConfig } from '../../types/engine';

export class CityBuilder {
  public static build(dna: StructuresDNA, prng: PRNG, quality: QualityConfig): THREE.Group {
    const group = new THREE.Group();
    group.name = 'EnvironmentCity';

    const buildingCount = Math.floor((quality.profile === 'LOW' ? 25 : quality.profile === 'MEDIUM' ? 45 : 75) * dna.density);

    const baseBuildingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(dna.color || '#0b101d'),
      roughness: 0.3,
      metalness: 0.8,
      flatShading: true
    });

    const neonColors = [
      new THREE.Color(dna.neonGlowColor || '#00f0ff'),
      new THREE.Color(dna.secondaryColor || '#ff007f'),
      new THREE.Color('#00ffa3'),
      new THREE.Color('#7928ca')
    ];

    // Procedural skyscrapers on a city grid
    for (let i = 0; i < buildingCount; i++) {
      const width = prng.range(0.8, 2.2);
      const depth = prng.range(0.8, 2.2);
      const height = prng.range(2.5, 9.5) * (dna.scale || 1.0);

      const bGeo = new THREE.BoxGeometry(width, height, depth);
      const bMesh = new THREE.Mesh(bGeo, baseBuildingMat);

      const gx = (i % 8) * 3.4 - 12 + prng.range(-0.4, 0.4);
      const gz = Math.floor(i / 8) * 3.4 - 12 + prng.range(-0.4, 0.4);

      bMesh.position.set(gx, height / 2, gz);
      bMesh.castShadow = true;
      bMesh.receiveShadow = true;
      group.add(bMesh);

      // Neon roof beacon / spire
      if (prng.chance(0.6)) {
        const spireGeo = new THREE.CylinderGeometry(0.04, 0.08, height * 0.25, 4);
        const spireCol = neonColors[prng.intRange(0, neonColors.length - 1)];
        const spireMat = new THREE.MeshBasicMaterial({ color: spireCol });
        const spireMesh = new THREE.Mesh(spireGeo, spireMat);
        spireMesh.position.set(gx, height + (height * 0.25) / 2, gz);
        group.add(spireMesh);
      }

      // Neon window band / holographic trim
      if (prng.chance(0.7)) {
        const bandGeo = new THREE.BoxGeometry(width * 1.02, 0.15, depth * 1.02);
        const bandCol = neonColors[prng.intRange(0, neonColors.length - 1)];
        const bandMat = new THREE.MeshBasicMaterial({ color: bandCol });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.position.set(gx, height * prng.range(0.3, 0.8), gz);
        group.add(bandMesh);
      }
    }

    // Traffic streaks (cyber highway lights)
    this.buildTrafficStreaks(group, prng, quality);

    return group;
  }

  private static buildTrafficStreaks(group: THREE.Group, prng: PRNG, quality: QualityConfig) {
    const streakCount = quality.profile === 'LOW' ? 120 : quality.profile === 'MEDIUM' ? 280 : 500;
    const pos = new Float32Array(streakCount * 3);
    const colors = new Float32Array(streakCount * 3);

    const cCyan = new THREE.Color(0x00f0ff);
    const cPink = new THREE.Color(0xff0055);
    const temp = new THREE.Color();

    for (let i = 0; i < streakCount; i++) {
      const isEastWest = i % 2 === 0;
      if (isEastWest) {
        pos[i * 3] = prng.range(-15, 15);
        pos[i * 3 + 1] = prng.range(0.2, 4.5); // flying car altitudes
        pos[i * 3 + 2] = prng.intRange(-3, 3) * 3.4;
        temp.copy(cCyan);
      } else {
        pos[i * 3] = prng.intRange(-3, 3) * 3.4;
        pos[i * 3 + 1] = prng.range(0.2, 4.5);
        pos[i * 3 + 2] = prng.range(-15, 15);
        temp.copy(cPink);
      }

      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    const traffic = new THREE.Points(geo, mat);
    traffic.name = 'CyberTraffic';
    group.add(traffic);
  }

  public static update(group: THREE.Group, time: number, delta: number) {
    const traffic = group.getObjectByName('CyberTraffic') as THREE.Points;
    if (traffic) {
      const pos = traffic.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const isEastWest = i % 2 === 0;
        if (isEastWest) {
          let x = pos.getX(i) + delta * 6.0;
          if (x > 15) x = -15;
          pos.setX(i, x);
        } else {
          let z = pos.getZ(i) - delta * 6.0;
          if (z < -15) z = 15;
          pos.setZ(i, z);
        }
      }
      pos.needsUpdate = true;
    }
  }
}
