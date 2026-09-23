import * as THREE from 'three';
import { EnvironmentDNA } from './types/environmentDNA';
import { QualityConfig } from '../types/engine';
import { PRNG } from './seed/PRNG';
import { TerrainBuilder } from './generators/TerrainBuilder';
import { WaterLavaBuilder } from './generators/WaterLavaBuilder';
import { FloraBuilder } from './generators/FloraBuilder';
import { CityBuilder } from './generators/CityBuilder';
import { CrystalBuilder } from './generators/CrystalBuilder';
import { FractalOrganicBuilder } from './generators/FractalOrganicBuilder';

export interface GeneratedEnvironment {
  rootGroup: THREE.Group;
  dna: EnvironmentDNA;
  prng: PRNG;
  update: (time: number, delta: number, windStrength: number) => void;
  dispose: () => void;
}

export class EnvironmentGenerator {
  public static generate(dna: EnvironmentDNA, quality: QualityConfig): GeneratedEnvironment {
    const rootGroup = new THREE.Group();
    rootGroup.name = `Environment_${dna.id}`;

    // Seeded PRNG ensures exact repeatability
    const prng = new PRNG(dna.seed);

    // 1. Procedural Terrain
    const terrainGroup = TerrainBuilder.build(dna.terrain, prng, quality);
    rootGroup.add(terrainGroup);

    // 2. Liquid / Ocean / Lava
    const liquidGroup = WaterLavaBuilder.build(dna.liquid, prng, quality);
    rootGroup.add(liquidGroup);

    // 3. Structures (Flora, City, Crystals, Fractals, etc.)
    let floraGroup: THREE.Group | null = null;
    let cityGroup: THREE.Group | null = null;
    let crystalGroup: THREE.Group | null = null;
    let fractalGroup: THREE.Group | null = null;

    if (dna.structures.type === 'trees' || dna.structures.type === 'bamboo') {
      floraGroup = FloraBuilder.build(dna.structures, prng, quality);
      rootGroup.add(floraGroup);
    } else if (dna.structures.type === 'skyscrapers') {
      cityGroup = CityBuilder.build(dna.structures, prng, quality);
      rootGroup.add(cityGroup);
    } else if (dna.structures.type === 'crystals') {
      crystalGroup = CrystalBuilder.build(dna.structures, prng, quality);
      rootGroup.add(crystalGroup);
    } else if (
      dna.structures.type === 'portals' ||
      dna.structures.type === 'organic-cells' ||
      dna.structures.type === 'fractals'
    ) {
      fractalGroup = FractalOrganicBuilder.build(dna.structures, prng, quality);
      rootGroup.add(fractalGroup);
    }

    const update = (time: number, delta: number, windStrength: number) => {
      // Animate terrain floating rocks if any
      for (const child of terrainGroup.children) {
        if (child.userData && child.userData.floatSpeed !== undefined) {
          child.position.y = child.userData.initialY + Math.sin(time * child.userData.floatSpeed + child.userData.floatOffset) * 0.4;
          child.rotation.y += delta * 0.2;
        }
      }

      // Update liquids
      WaterLavaBuilder.update(liquidGroup, time, delta);

      // Update active structure groups
      if (floraGroup) {
        FloraBuilder.update(floraGroup, time, delta, windStrength);
      }
      if (cityGroup) {
        CityBuilder.update(cityGroup, time, delta);
      }
      if (crystalGroup) {
        CrystalBuilder.update(crystalGroup, time, delta);
      }
      if (fractalGroup) {
        FractalOrganicBuilder.update(fractalGroup, time, delta);
      }
    };

    const dispose = () => {
      rootGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        } else if (obj instanceof THREE.Points) {
          obj.geometry.dispose();
          if (obj.material instanceof THREE.Material) {
            obj.material.dispose();
          }
        }
      });
      rootGroup.clear();
    };

    return {
      rootGroup,
      dna,
      prng,
      update,
      dispose
    };
  }
}
