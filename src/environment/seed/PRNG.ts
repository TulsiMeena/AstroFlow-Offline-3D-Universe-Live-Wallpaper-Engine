/**
 * High-performance deterministic Pseudorandom Number Generator (Mulberry32)
 * Ensures that identical EnvironmentDNA + Seed reproduces the exact same 3D environment every time.
 */
export class PRNG {
  private s: number;

  constructor(seed: number = 1337) {
    this.s = seed >>> 0;
  }

  public setSeed(seed: number): void {
    this.s = seed >>> 0;
  }

  public getSeed(): number {
    return this.s;
  }

  /**
   * Generates a deterministic float between 0.0 (inclusive) and 1.0 (exclusive)
   */
  public next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a float between min and max
   */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generates an integer between min and max inclusive
   */
  public intRange(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Generates a boolean with given probability
   */
  public chance(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Deterministic 2D Value Noise for smooth procedural terrain heights
   */
  public noise2D(x: number, y: number): number {
    const X = Math.floor(x);
    const Y = Math.floor(y);
    const fx = x - X;
    const fy = y - Y;

    // Smoothstep interpolation
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);

    const s00 = this.hash2D(X, Y);
    const s10 = this.hash2D(X + 1, Y);
    const s01 = this.hash2D(X, Y + 1);
    const s11 = this.hash2D(X + 1, Y + 1);

    const x1 = s00 + u * (s10 - s00);
    const x2 = s01 + u * (s11 - s01);
    return x1 + v * (x2 - x1);
  }

  /**
   * Fractal Brownian Motion (fBm) with multiple octaves for realistic mountains & waves
   */
  public fbm2D(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxValue;
  }

  private hash2D(x: number, y: number): number {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + this.s;
    n = (n ^ (n >>> 13)) * 1274126177;
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
}
