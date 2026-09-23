import * as THREE from 'three';

export interface GravitySourceItem {
  id: string;
  position: THREE.Vector3;
  mass: number; // Positive = attractive, negative = repulsive
  radius: number; // Core radius inside which force softens
  falloff: number; // Exponent for distance falloff (default 2)
  enabled: boolean;
}

export class GravityManager {
  private sources: GravitySourceItem[] = [];

  public addSource(source: GravitySourceItem) {
    const existing = this.sources.find(s => s.id === source.id);
    if (existing) {
      Object.assign(existing, source);
    } else {
      this.sources.push(source);
    }
  }

  public removeSource(id: string) {
    this.sources = this.sources.filter(s => s.id !== id);
  }

  public clear() {
    this.sources = [];
  }

  public getSources(): GravitySourceItem[] {
    return this.sources;
  }

  public setSourcePosition(id: string, x: number, y: number, z: number) {
    const s = this.sources.find(src => src.id === id);
    if (s) {
      s.position.set(x, y, z);
    }
  }

  /**
   * Applies all active gravity sources to particle positions and velocities in-place.
   * High performance, zero allocations.
   */
  public applyToParticles(
    positions: Float32Array,
    velocities: Float32Array,
    count: number,
    delta: number,
    damping: number = 0.99
  ) {
    const activeSources = this.sources.filter(s => s.enabled && s.mass !== 0);
    if (activeSources.length === 0) return;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];

      let ax = 0;
      let ay = 0;
      let az = 0;

      for (let s = 0; s < activeSources.length; s++) {
        const src = activeSources[s];
        const dx = src.position.x - px;
        const dy = src.position.y - py;
        const dz = src.position.z - pz;
        const distSq = dx * dx + dy * dy + dz * dz + (src.radius * src.radius);

        const dist = Math.sqrt(distSq);
        // Softened Newtonian gravity: a = G * M / (dist^falloff)
        const forceMag = (src.mass * 8.0) / Math.pow(dist, src.falloff);

        const invDist = 1.0 / dist;
        ax += dx * invDist * forceMag;
        ay += dy * invDist * forceMag;
        az += dz * invDist * forceMag;
      }

      velocities[idx] = (velocities[idx] + ax * delta) * damping;
      velocities[idx + 1] = (velocities[idx + 1] + ay * delta) * damping;
      velocities[idx + 2] = (velocities[idx + 2] + az * delta) * damping;
    }
  }
}
