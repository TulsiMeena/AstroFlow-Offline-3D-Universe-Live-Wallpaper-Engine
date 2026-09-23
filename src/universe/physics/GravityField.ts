import * as THREE from 'three';

export interface GravitySource {
  id: string;
  position: THREE.Vector3;
  mass: number;
  radius: number;
  falloff: number; // Exponent (typically 2 for inverse-square)
}

export class GravityField {
  private sources: GravitySource[] = [];
  private readonly epsilon: number = 0.5; // Softening parameter to prevent singularity infinity

  public addSource(source: GravitySource): void {
    this.sources.push(source);
  }

  public removeSource(id: string): void {
    this.sources = this.sources.filter(s => s.id !== id);
  }

  public clearSources(): void {
    this.sources = [];
  }

  /**
   * Applies gravitational acceleration in-place to particle positions and velocities using preallocated arrays.
   * Zero heap allocation per tick.
   */
  public updateParticles(
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    delta: number,
    globalStrength = 1.0,
    damping = 0.999
  ): void {
    const srcLen = this.sources.length;
    if (srcLen === 0) return;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];

      let ax = 0;
      let ay = 0;
      let az = 0;

      for (let s = 0; s < srcLen; s++) {
        const src = this.sources[s];
        const dx = src.position.x - px;
        const dy = src.position.y - py;
        const dz = src.position.z - pz;

        const distSq = dx * dx + dy * dy + dz * dz + this.epsilon;
        const dist = Math.sqrt(distSq);

        if (dist > src.radius) {
          // G * M / (r^falloff)
          const force = (src.mass * globalStrength) / Math.pow(distSq, src.falloff * 0.5);
          const invDist = 1.0 / dist;
          ax += dx * invDist * force;
          ay += dy * invDist * force;
          az += dz * invDist * force;
        }
      }

      // Update velocity
      velocities[idx] = (velocities[idx] + ax * delta) * damping;
      velocities[idx + 1] = (velocities[idx + 1] + ay * delta) * damping;
      velocities[idx + 2] = (velocities[idx + 2] + az * delta) * damping;

      // Update position
      positions[idx] += velocities[idx] * delta;
      positions[idx + 1] += velocities[idx + 1] * delta;
      positions[idx + 2] += velocities[idx + 2] * delta;
    }
  }

  /**
   * Initializes stable circular or elliptical tangential orbital velocities around a primary source.
   */
  public injectOrbitalVelocities(
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    primarySourceIndex = 0,
    speedMultiplier = 1.0
  ): void {
    if (this.sources.length <= primarySourceIndex) return;
    const src = this.sources[primarySourceIndex];

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const dx = positions[idx] - src.position.x;
      const dz = positions[idx + 2] - src.position.z;
      const r = Math.sqrt(dx * dx + dz * dz);

      if (r > 0.1) {
        // v = sqrt(G * M / r)
        const v = Math.sqrt((src.mass) / r) * speedMultiplier;
        // Tangent vector (-dz, dx)
        velocities[idx] = (-dz / r) * v;
        velocities[idx + 1] = (Math.random() - 0.5) * 0.2;
        velocities[idx + 2] = (dx / r) * v;
      }
    }
  }
}
