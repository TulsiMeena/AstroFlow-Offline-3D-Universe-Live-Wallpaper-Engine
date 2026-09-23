import * as THREE from 'three';
import { BaseWallpaper } from './BaseWallpaper';
import { WallpaperMetadata, WallpaperUpdateContext } from '../types/wallpaper';
import { SeededRNG } from '../universe/seed/SeededRNG';
import { UniverseSeedEngine } from '../universe/seed/UniverseSeedEngine';
import { InfiniteSpaceController } from '../universe/camera/InfiniteSpaceController';
import { EventManager } from '../universe/events/EventManager';
import { AsteroidBeltGenerator } from '../universe/generators/AsteroidBeltGenerator';

export class InfiniteUniverseWallpaper extends BaseWallpaper {
  public readonly metadata: WallpaperMetadata = {
    id: 'infinite-universe',
    title: 'Infinite Universe',
    subtitle: 'Boundless Floating-Origin Cosmos',
    category: 'Cosmic Universes',
    description: 'Boundless space navigation using a floating-origin coordinate engine, wrapping cosmic dust, floating asteroid fields, and procedural cosmic shockwaves.',
    author: 'Amit Meena',
    tags: ['Infinite', 'Floating Origin', 'Boundless', 'Events', 'Cosmos'],
    accentColor: '#00FFE0',
    secondaryColor: '#FF00A0',
    interactive: true,
    proceduralType: 'universe'
  };

  private infiniteController: InfiniteSpaceController | null = null;
  private eventManager: EventManager | null = null;
  private asteroidBelt: { group: THREE.Group; update: (t: number, d: number) => void; dispose: () => void } | null = null;
  private starPoints: THREE.Points | null = null;
  private starGeo: THREE.BufferGeometry | null = null;
  private starMat: THREE.PointsMaterial | null = null;
  private cameraVelocity = new THREE.Vector3(0, 0, -8);

  protected buildScene(): void {
    const dna = UniverseSeedEngine.createDNAFromSeed('INFINITE-9999-COSMOS');
    const rng = new SeededRNG(dna.seed);

    const universeSize = 250;
    this.infiniteController = new InfiniteSpaceController(universeSize);

    if (this.scene) {
      this.eventManager = new EventManager(dna);
      this.eventManager.setScene(this.scene);
    }

    // Generate wrapping stars
    const count = 4000;
    this.starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const half = universeSize * 0.5;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      positions[idx] = rng.range(-half, half);
      positions[idx + 1] = rng.range(-half, half);
      positions[idx + 2] = rng.range(-half, half);

      const col = new THREE.Color(rng.choice(['#00F0FF', '#FF007F', '#FFFFFF', '#FFD2A1', '#7000FF']));
      colors[idx] = col.r;
      colors[idx + 1] = col.g;
      colors[idx + 2] = col.b;
    }

    this.starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.starMat = new THREE.PointsMaterial({
      size: 2.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(this.starGeo, this.starMat);
    this.rootGroup.add(this.starPoints);

    // Drifting asteroid field
    this.asteroidBelt = AsteroidBeltGenerator.createAsteroidBelt(rng.fork('asteroids'), {
      count: 180,
      innerRadius: 20,
      outerRadius: 80,
      heightVariation: 25
    });
    this.rootGroup.add(this.asteroidBelt.group);

    if (this.camera) {
      this.camera.position.set(0, 0, 30);
      this.camera.lookAt(0, 0, 0);
    }
  }

  public update(ctx: WallpaperUpdateContext): void {
    if (this.eventManager) {
      this.eventManager.update(ctx.delta);
    }
    if (this.asteroidBelt) {
      this.asteroidBelt.update(ctx.time, ctx.delta);
    }

    // Continuous smooth forward flight with steering
    if (this.camera && this.infiniteController && this.starGeo) {
      const steerX = (ctx.input.x * 15) + (ctx.motion.isAvailable ? ctx.motion.tiltX * 10 : 0);
      const steerY = (ctx.input.y * 15) + (ctx.motion.isAvailable ? ctx.motion.tiltY * 10 : 0);

      this.camera.position.x += (steerX - this.camera.position.x) * 0.03;
      this.camera.position.y += (steerY - this.camera.position.y) * 0.03;
      this.camera.position.z += this.cameraVelocity.z * ctx.delta;

      // Wrap stars around camera
      const posAttr = this.starGeo.attributes.position as THREE.BufferAttribute;
      this.infiniteController.wrapPositions(
        posAttr.array as Float32Array,
        posAttr.count,
        this.camera.position
      );
      posAttr.needsUpdate = true;

      this.camera.lookAt(this.camera.position.x * 0.5, this.camera.position.y * 0.5, this.camera.position.z - 50);
    }
  }

  public dispose(): void {
    if (this.eventManager) {
      this.eventManager.dispose();
      this.eventManager = null;
    }
    if (this.asteroidBelt) {
      this.asteroidBelt.dispose();
      this.asteroidBelt = null;
    }
    if (this.starGeo) {
      this.starGeo.dispose();
      this.starGeo = null;
    }
    if (this.starMat) {
      this.starMat.dispose();
      this.starMat = null;
    }
    this.starPoints = null;
    this.infiniteController = null;
    super.dispose();
  }
}
