import * as THREE from 'three';
import { LifeEntityType } from './EcosystemDNA';

export class ProceduralLifeGenerator {
  /**
   * Generates a streamlined, low-poly procedural bird geometry with wing surfaces.
   */
  public static createBirdGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    // Fuselage + 2 wings (V-shape)
    // Vertices: nose, tail, left wingtip, right wingtip, belly
    const vertices = new Float32Array([
      // Fuselage
      0, 0, 0.4,       // 0: beak/nose
      -0.08, 0.05, 0,  // 1: left shoulder
      0.08, 0.05, 0,   // 2: right shoulder
      0, 0, -0.4,      // 3: tail tip
      0, -0.06, 0,     // 4: belly

      // Left wing
      -0.08, 0.05, 0.08, // 5: left wing base front
      -0.65, 0.12, -0.05,// 6: left wing tip
      -0.08, 0.04, -0.15,// 7: left wing base rear

      // Right wing
      0.08, 0.05, 0.08,  // 8: right wing base front
      0.65, 0.12, -0.05, // 9: right wing tip
      0.08, 0.04, -0.15  // 10: right wing base rear
    ]);

    const indices = [
      // Fuselage top & sides
      0, 1, 3,
      0, 3, 2,
      0, 4, 1,
      0, 2, 4,
      1, 4, 3,
      2, 3, 4,
      // Left wing (double sided)
      5, 6, 7,
      5, 7, 6,
      // Right wing (double sided)
      8, 10, 9,
      8, 9, 10
    ];

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Generates a fluttering butterfly geometry with double-sided wings.
   */
  public static createButterflyGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      // Thorax
      0, 0, 0.12,
      0, 0, -0.12,
      0, 0.03, 0,
      // Left forewing
      0, 0.01, 0.04,
      -0.28, 0.12, 0.16,
      -0.22, 0.02, -0.05,
      // Left hindwing
      0, 0, -0.04,
      -0.22, 0.02, -0.05,
      -0.15, -0.05, -0.18,
      // Right forewing
      0, 0.01, 0.04,
      0.22, 0.02, -0.05,
      0.28, 0.12, 0.16,
      // Right hindwing
      0, 0, -0.04,
      0.15, -0.05, -0.18,
      0.22, 0.02, -0.05
    ]);

    const indices = [
      0, 2, 1,
      // Left wings
      3, 4, 5, 3, 5, 4,
      6, 7, 8, 6, 8, 7,
      // Right wings
      9, 10, 11, 9, 11, 10,
      12, 13, 14, 12, 14, 13
    ];

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Generates a sleek fish geometry with tapered tail and dorsal ridge.
   */
  public static createFishGeometry(): THREE.BufferGeometry {
    const geom = new THREE.ConeGeometry(0.12, 0.55, 5, 2);
    geom.rotateX(Math.PI / 2);
    geom.scale(1.0, 1.4, 1.0); // flatten laterally
    return geom;
  }

  /**
   * Generates an organic curled leaf geometry.
   */
  public static createLeafGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0, 0.2,       // Tip
      -0.12, 0.04, 0,  // Left lobe
      0.12, 0.04, 0,   // Right lobe
      0, 0, -0.2,      // Stem
      0, -0.03, 0      // Keel center
    ]);
    const indices = [
      0, 1, 4, 0, 4, 2,
      1, 3, 4, 2, 4, 3,
      // Reverse
      0, 4, 1, 0, 2, 4,
      1, 4, 3, 2, 3, 4
    ];
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Generates a cloud puff geometry.
   */
  public static createCloudGeometry(): THREE.BufferGeometry {
    return new THREE.DodecahedronGeometry(1.2, 1);
  }

  /**
   * Generates an underwater creature (jellyfish / manta) geometry.
   */
  public static createUnderwaterCreatureGeometry(): THREE.BufferGeometry {
    const geom = new THREE.SphereGeometry(0.35, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.6);
    return geom;
  }

  /**
   * Generates a cyber drone geometry.
   */
  public static createCyberDroneGeometry(): THREE.BufferGeometry {
    const geom = new THREE.BufferGeometry();
    // Triangular stealth wedge with engine pods
    const vertices = new Float32Array([
      0, 0.04, 0.45,     // 0: nose
      -0.3, 0.02, -0.3,  // 1: left wingtip
      0.3, 0.02, -0.3,   // 2: right wingtip
      0, -0.05, 0,       // 3: belly
      0, 0.08, -0.25     // 4: cockpit
    ]);
    const indices = [
      0, 4, 1,
      0, 2, 4,
      1, 4, 2,
      0, 1, 3,
      0, 3, 2,
      1, 2, 3
    ];
    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }

  /**
   * Generates volcanic ember geometry.
   */
  public static createEmberGeometry(): THREE.BufferGeometry {
    return new THREE.OctahedronGeometry(0.08, 0);
  }

  /**
   * Generates firefly / insect / spore micro-geometry.
   */
  public static createInsectGeometry(): THREE.BufferGeometry {
    return new THREE.TetrahedronGeometry(0.05, 0);
  }

  /**
   * Factory for materials tailored to entity type with procedural coloring and glow.
   */
  public static createEntityMaterial(type: LifeEntityType): THREE.Material {
    switch (type) {
      case 'birds':
        return new THREE.MeshStandardMaterial({
          color: 0x223344,
          roughness: 0.7,
          metalness: 0.1,
          flatShading: true
        });
      case 'butterflies':
        return new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x005577,
          emissiveIntensity: 0.4,
          roughness: 0.3,
          side: THREE.DoubleSide
        });
      case 'fish':
        return new THREE.MeshStandardMaterial({
          color: 0x00ffa3,
          emissive: 0x003322,
          roughness: 0.4,
          metalness: 0.2
        });
      case 'fireflies':
        return new THREE.MeshBasicMaterial({
          color: 0xadff2f,
          wireframe: false
        });
      case 'leaves':
        return new THREE.MeshStandardMaterial({
          color: 0x38b000,
          roughness: 0.8,
          side: THREE.DoubleSide
        });
      case 'clouds':
        return new THREE.MeshStandardMaterial({
          color: 0xeeeeff,
          transparent: true,
          opacity: 0.55,
          roughness: 1.0,
          flatShading: true
        });
      case 'underwater-creatures':
        return new THREE.MeshStandardMaterial({
          color: 0x7000ff,
          emissive: 0x300077,
          transparent: true,
          opacity: 0.7,
          roughness: 0.2,
          side: THREE.DoubleSide
        });
      case 'drones':
      case 'light-traffic':
        return new THREE.MeshStandardMaterial({
          color: 0x111118,
          emissive: 0x00f0ff,
          emissiveIntensity: 0.8,
          metalness: 0.8,
          roughness: 0.2
        });
      case 'volcanic-embers':
        return new THREE.MeshBasicMaterial({
          color: 0xff3b00
        });
      case 'insects':
      case 'drifting-spores':
      default:
        return new THREE.MeshBasicMaterial({
          color: 0xffffff
        });
    }
  }
}
