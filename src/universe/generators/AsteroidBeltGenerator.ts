import * as THREE from 'three';
import { SeededRNG } from '../seed/SeededRNG';

export interface AsteroidBeltOptions {
  count?: number;
  innerRadius?: number;
  outerRadius?: number;
  heightVariation?: number;
  baseColor?: string;
}

export class AsteroidBeltGenerator {
  /**
   * Creates an optimized InstancedMesh asteroid belt orbiting in a torus.
   */
  public static createAsteroidBelt(
    rng: SeededRNG,
    options: AsteroidBeltOptions = {}
  ): {
    group: THREE.Group;
    update: (time: number, delta: number) => void;
    dispose: () => void;
  } {
    const group = new THREE.Group();
    group.name = 'AsteroidBelt_Instanced';

    const count = options.count ?? 350;
    const innerRadius = options.innerRadius ?? 35;
    const outerRadius = options.outerRadius ?? 50;
    const heightVariation = options.heightVariation ?? 2.5;

    // Low-poly icosahedron for asteroids
    const geo = new THREE.IcosahedronGeometry(0.35, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(options.baseColor ?? '#64748B'),
      roughness: 0.95,
      metalness: 0.1
    });

    const instancedMesh = new THREE.InstancedMesh(geo, mat, count);
    instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const asteroidData: {
      radius: number;
      angle: number;
      speed: number;
      rotSpeedX: number;
      rotSpeedY: number;
      height: number;
      scale: number;
    }[] = [];

    for (let i = 0; i < count; i++) {
      const radius = rng.range(innerRadius, outerRadius);
      const angle = rng.next() * Math.PI * 2;
      const speed = (0.25 / Math.sqrt(radius * 0.1)) * (0.8 + rng.next() * 0.4);
      const height = rng.gaussian(0, heightVariation * 0.4);
      const scale = rng.range(0.4, 1.4);

      asteroidData.push({
        radius,
        angle,
        speed,
        rotSpeedX: rng.range(-1.5, 1.5),
        rotSpeedY: rng.range(-1.5, 1.5),
        height,
        scale
      });

      dummy.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    group.add(instancedMesh);

    const update = (time: number, delta: number) => {
      for (let i = 0; i < count; i++) {
        const a = asteroidData[i];
        a.angle += delta * a.speed * 0.5;

        dummy.position.set(
          Math.cos(a.angle) * a.radius,
          a.height,
          Math.sin(a.angle) * a.radius
        );
        dummy.rotation.x = time * a.rotSpeedX;
        dummy.rotation.y = time * a.rotSpeedY;
        dummy.scale.set(a.scale, a.scale, a.scale);
        dummy.updateMatrix();

        instancedMesh.setMatrixAt(i, dummy.matrix);
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
    };

    const dispose = () => {
      geo.dispose();
      mat.dispose();
      instancedMesh.dispose();
    };

    return { group, update, dispose };
  }
}
