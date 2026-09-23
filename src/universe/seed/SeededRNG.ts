/**
 * High-performance deterministic Seeded Pseudo-Random Number Generator (PRNG).
 * Uses Mulberry32 algorithm driven by 32-bit FNV-1a string hashing.
 * Guarantees identical output sequence given the same seed.
 */
export class SeededRNG {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === 'number' ? (seed | 0) : SeededRNG.hashString(seed);
    if (this.state === 0) this.state = 1337;
  }

  /**
   * Hashes a string seed into a 32-bit unsigned integer using FNV-1a.
   */
  public static hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Returns a pseudo-random float in [0, 1).
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random float in [min, max).
   */
  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Returns a pseudo-random integer in [min, max] (inclusive).
   */
  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Returns true with the given probability (default 0.5).
   */
  public boolean(chance = 0.5): boolean {
    return this.next() < chance;
  }

  /**
   * Picks a random element from an array deterministically.
   */
  public choice<T>(items: T[]): T {
    if (items.length === 0) throw new Error('Cannot pick from empty array');
    const index = Math.floor(this.next() * items.length);
    return items[index];
  }

  /**
   * Gaussian distributed random number using Box-Muller transform.
   */
  public gaussian(mean = 0, stdev = 1): number {
    const u1 = Math.max(1e-7, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return mean + z0 * stdev;
  }

  /**
   * Creates an independent child RNG branched deterministically from the current state.
   */
  public fork(tag?: string): SeededRNG {
    const nextVal = this.next();
    const childSeed = tag ? `${this.state}_${tag}_${nextVal}` : this.state ^ (Math.imul(nextVal * 1000000, 31));
    return new SeededRNG(childSeed);
  }
}
