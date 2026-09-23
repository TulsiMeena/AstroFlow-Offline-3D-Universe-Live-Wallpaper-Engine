export class RhythmDetector {
  private energyDeltas: number[] = [];
  private maxDeltas: number = 30;
  private previousEnergy: number = 0;
  private rhythmIntensity: number = 0;
  private regularityScore: number = 0;

  /**
   * Evaluates groove, cadence stability, and rhythmic periodicity
   */
  public update(energy: number, isBeat: boolean, delta: number): number {
    const energyDelta = Math.abs(energy - this.previousEnergy);
    this.previousEnergy = energy;

    this.energyDeltas.push(energyDelta);
    if (this.energyDeltas.length > this.maxDeltas) {
      this.energyDeltas.shift();
    }

    // Dynamic flux calculation
    let fluxSum = 0;
    for (let i = 0; i < this.energyDeltas.length; i++) {
      fluxSum += this.energyDeltas[i];
    }
    const avgFlux = fluxSum / (this.energyDeltas.length || 1);

    // If beats are arriving, increment regularity and groove intensity
    if (isBeat) {
      this.regularityScore = Math.min(1.0, this.regularityScore + 0.25);
    } else {
      this.regularityScore = Math.max(0.0, this.regularityScore - delta * 0.4);
    }

    const targetIntensity = Math.min(1.0, avgFlux * 3.5 + this.regularityScore * 0.5);

    // Smooth output
    this.rhythmIntensity = this.rhythmIntensity * 0.85 + targetIntensity * 0.15;
    return this.rhythmIntensity;
  }

  public reset(): void {
    this.energyDeltas = [];
    this.previousEnergy = 0;
    this.rhythmIntensity = 0;
    this.regularityScore = 0;
  }
}
