export interface RippleInstance {
  x: number;
  y: number;
  startTime: number;
  strength: number;
  maxRadius: number;
  speed: number;
  decay: number;
  active: boolean;
}

export class RippleField {
  private ripples: RippleInstance[] = [];
  private maxConcurrentRipples: number = 8;
  private defaultSpeed: number = 3.5;
  private defaultMaxRadius: number = 8.0;
  private defaultDecay: number = 1.2;

  constructor(maxConcurrent: number = 8) {
    this.maxConcurrentRipples = maxConcurrent;
    // Pre-allocate pool
    for (let i = 0; i < this.maxConcurrentRipples; i++) {
      this.ripples.push({
        x: 0,
        y: 0,
        startTime: 0,
        strength: 0,
        maxRadius: this.defaultMaxRadius,
        speed: this.defaultSpeed,
        decay: this.defaultDecay,
        active: false
      });
    }
  }

  public spawnRipple(
    x: number,
    y: number,
    strength: number = 1.0,
    speed: number = this.defaultSpeed,
    maxRadius: number = this.defaultMaxRadius
  ) {
    // Find first inactive or oldest ripple
    let target = this.ripples.find(r => !r.active);
    if (!target) {
      target = this.ripples[0];
    }

    target.x = x;
    target.y = y;
    target.startTime = performance.now() * 0.001;
    target.strength = strength;
    target.speed = speed;
    target.maxRadius = maxRadius;
    target.decay = this.defaultDecay;
    target.active = true;
  }

  public update(time: number) {
    for (let i = 0; i < this.ripples.length; i++) {
      const r = this.ripples[i];
      if (!r.active) continue;

      const age = time - r.startTime;
      const currentRadius = age * r.speed;

      if (currentRadius > r.maxRadius || age * r.decay > 1.0) {
        r.active = false;
      }
    }
  }

  /**
   * Calculates surface elevation/displacement at a given 2D coordinate.
   * Returns vertical offset `height` and normal gradients `nx`, `ny`.
   */
  public sampleHeightAndNormal(
    px: number,
    py: number,
    time: number
  ): { height: number; nx: number; ny: number } {
    let totalHeight = 0;
    let gradX = 0;
    let gradY = 0;

    for (let i = 0; i < this.ripples.length; i++) {
      const r = this.ripples[i];
      if (!r.active) continue;

      const age = time - r.startTime;
      const waveRadius = age * r.speed;
      const dx = px - r.x;
      const dy = py - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const deltaR = dist - waveRadius;
      if (Math.abs(deltaR) > 2.0) continue; // Outside ripple wave crest

      const amp = r.strength * Math.max(0, 1.0 - age * r.decay) * Math.max(0, 1.0 - dist / r.maxRadius);
      const wave = Math.cos(deltaR * 3.1415) * amp;

      totalHeight += wave;

      // Calculate directional gradients for lighting refraction
      if (dist > 0.001) {
        const dWave = -Math.sin(deltaR * 3.1415) * amp * 3.1415;
        gradX += (dx / dist) * dWave;
        gradY += (dy / dist) * dWave;
      }
    }

    return { height: totalHeight, nx: gradX, ny: gradY };
  }

  /**
   * Encodes active ripple data into a Float32Array suitable for feeding into shader uniforms:
   * vec4 uRipples[8] -> (x, y, radius, intensity)
   */
  public packForUniforms(targetArray: Float32Array, time: number) {
    for (let i = 0; i < this.maxConcurrentRipples; i++) {
      const idx = i * 4;
      const r = this.ripples[i];
      if (r && r.active) {
        const age = time - r.startTime;
        const radius = age * r.speed;
        const intensity = r.strength * Math.max(0, 1.0 - age * r.decay);
        targetArray[idx] = r.x;
        targetArray[idx + 1] = r.y;
        targetArray[idx + 2] = radius;
        targetArray[idx + 3] = intensity;
      } else {
        targetArray[idx] = 0;
        targetArray[idx + 1] = 0;
        targetArray[idx + 2] = -1;
        targetArray[idx + 3] = 0;
      }
    }
  }

  public getActiveCount(): number {
    return this.ripples.filter(r => r.active).length;
  }

  public clear() {
    for (const r of this.ripples) {
      r.active = false;
    }
  }
}
