import * as THREE from 'three';

export type InteractionFieldMode =
  | 'attraction'
  | 'repulsion'
  | 'vortex'
  | 'ripple'
  | 'impulse'
  | 'turbulence';

export interface InteractionFieldConfig {
  mode?: InteractionFieldMode;
  strength?: number;
  radius?: number;
  falloff?: number; // 1 = linear, 2 = quadratic
  duration?: number; // In seconds (0 for persistent)
}

export class InteractionField {
  public mode: InteractionFieldMode = 'attraction';
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public strength: number = 1.0;
  public radius: number = 6.0;
  public falloff: number = 1.5;
  public duration: number = 0; // 0 = persistent
  public elapsed: number = 0;
  public active: boolean = true;

  // Impulse directional vector (e.g. for swipe)
  public impulseVector: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  constructor(config: InteractionFieldConfig = {}) {
    this.configure(config);
  }

  public configure(config: InteractionFieldConfig) {
    if (config.mode !== undefined) this.mode = config.mode;
    if (config.strength !== undefined) this.strength = config.strength;
    if (config.radius !== undefined) this.radius = config.radius;
    if (config.falloff !== undefined) this.falloff = config.falloff;
    if (config.duration !== undefined) {
      this.duration = config.duration;
      this.elapsed = 0;
    }
    this.active = true;
  }

  public setPosition(x: number, y: number, z: number = 0) {
    this.position.set(x, y, z);
  }

  public update(delta: number) {
    if (!this.active) return;

    if (this.duration > 0) {
      this.elapsed += delta;
      if (this.elapsed >= this.duration) {
        this.active = false;
      }
    }
  }

  /**
   * Applies the interaction field to particle arrays in-place with zero memory allocation.
   */
  public applyToParticles(
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    delta: number
  ) {
    if (!this.active || this.strength === 0) return;

    const fx = this.position.x;
    const fy = this.position.y;
    const fz = this.position.z;
    const radSq = this.radius * this.radius;

    // Decay multiplier if field has a lifespan
    let lifeMultiplier = 1.0;
    if (this.duration > 0) {
      lifeMultiplier = Math.max(0, 1.0 - this.elapsed / this.duration);
    }
    const currentStrength = this.strength * lifeMultiplier;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];

      const dx = px - fx;
      const dy = py - fy;
      const dz = pz - fz;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq > radSq || distSq < 0.0001) continue;

      const dist = Math.sqrt(distSq);
      const normDist = dist / this.radius;
      // Falloff weight: 1.0 at center, drops to 0 at edge
      const weight = Math.pow(1.0 - normDist, this.falloff);

      const invDist = 1.0 / dist;
      const nx = dx * invDist;
      const ny = dy * invDist;
      const nz = dz * invDist;

      switch (this.mode) {
        case 'attraction': {
          // Pulls towards field center
          const force = currentStrength * weight * 15.0 * delta;
          velocities[idx] -= nx * force;
          velocities[idx + 1] -= ny * force;
          velocities[idx + 2] -= nz * force;
          break;
        }

        case 'repulsion': {
          // Pushes away from center
          const force = currentStrength * weight * 20.0 * delta;
          velocities[idx] += nx * force;
          velocities[idx + 1] += ny * force;
          velocities[idx + 2] += nz * force;
          break;
        }

        case 'vortex': {
          // Tangential rotational swirl around Z axis
          const tangentialX = -ny;
          const tangentialY = nx;
          const force = currentStrength * weight * 18.0 * delta;
          velocities[idx] += tangentialX * force;
          velocities[idx + 1] += tangentialY * force;
          // Inward centripetal bias
          velocities[idx] -= nx * (force * 0.25);
          velocities[idx + 1] -= ny * (force * 0.25);
          break;
        }

        case 'ripple': {
          // Propagating wave expansion
          const wavePhase = (dist - this.elapsed * 8.0) * 1.5;
          const wave = Math.sin(wavePhase);
          const force = currentStrength * weight * wave * 12.0 * delta;
          velocities[idx] += nx * force;
          velocities[idx + 1] += ny * force;
          velocities[idx + 2] += wave * 5.0 * delta;
          break;
        }

        case 'impulse': {
          // Directional blast (e.g., from swipe)
          const force = currentStrength * weight * 25.0 * delta;
          velocities[idx] += (this.impulseVector.x + nx * 0.3) * force;
          velocities[idx + 1] += (this.impulseVector.y + ny * 0.3) * force;
          velocities[idx + 2] += (this.impulseVector.z + nz * 0.3) * force;
          break;
        }

        case 'turbulence': {
          // Chaotic pseudo-curl noise displacement
          const curlX = Math.sin(py * 1.5 + this.elapsed * 2.0);
          const curlY = Math.cos(px * 1.5 + this.elapsed * 2.0);
          const curlZ = Math.sin((px + py) * 1.2);
          const force = currentStrength * weight * 14.0 * delta;
          velocities[idx] += curlX * force;
          velocities[idx + 1] += curlY * force;
          velocities[idx + 2] += curlZ * force;
          break;
        }
      }
    }
  }
}
