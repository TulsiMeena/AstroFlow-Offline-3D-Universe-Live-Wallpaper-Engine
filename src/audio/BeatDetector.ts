export class BeatDetector {
  private energyHistory: number[] = [];
  private historySize: number = 43; // ~0.7 second sliding buffer at 60 FPS
  private beatCutoffTime: number = 0;
  private minBeatInterval: number = 0.22; // max ~270 BPM
  private beatTimes: number[] = [];
  private calculatedBpm: number = 120;
  private varianceMultiplier: number = 1.35;
  private beatConfidence: number = 0;

  /**
   * Process instantaneous bass + low-mid energy to detect rhythmic beats
   */
  public detect(bassEnergy: number, currentTime: number): { isBeat: boolean; confidence: number; bpm: number } {
    // Maintain sliding window of recent energy
    this.energyHistory.push(bassEnergy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    if (this.energyHistory.length < 8) {
      return { isBeat: false, confidence: 0, bpm: this.calculatedBpm };
    }

    // Calculate local average energy and variance
    let sum = 0;
    for (let i = 0; i < this.energyHistory.length; i++) {
      sum += this.energyHistory[i];
    }
    const avgEnergy = sum / this.energyHistory.length;

    let varianceSum = 0;
    for (let i = 0; i < this.energyHistory.length; i++) {
      const diff = this.energyHistory[i] - avgEnergy;
      varianceSum += diff * diff;
    }
    const variance = varianceSum / this.energyHistory.length;

    // Dynamic threshold: C factor depends inversely on variance
    const c = Math.max(1.15, Math.min(1.6, (-0.0025714 * variance) + 1.45));
    const dynamicThreshold = avgEnergy * c;

    let isBeat = false;

    // Check if current energy exceeds threshold and refractory lockout period has passed
    if (bassEnergy > dynamicThreshold && (currentTime - this.beatCutoffTime) > this.minBeatInterval) {
      if (bassEnergy > 0.08) { // Noise gate
        isBeat = true;
        this.beatCutoffTime = currentTime;
        this.beatConfidence = Math.min(1.0, (bassEnergy - dynamicThreshold) / Math.max(0.01, avgEnergy));

        // Track BPM via Inter-Beat Intervals (IBI)
        this.beatTimes.push(currentTime);
        if (this.beatTimes.length > 8) {
          this.beatTimes.shift();
        }

        if (this.beatTimes.length >= 4) {
          let totalInterval = 0;
          let intervalsCount = 0;
          for (let i = 1; i < this.beatTimes.length; i++) {
            const interval = this.beatTimes[i] - this.beatTimes[i - 1];
            if (interval >= 0.25 && interval <= 1.5) { // 40 BPM to 240 BPM
              totalInterval += interval;
              intervalsCount++;
            }
          }

          if (intervalsCount > 0) {
            const avgInterval = totalInterval / intervalsCount;
            const instantaneousBpm = 60 / avgInterval;
            // Smooth BPM transition
            this.calculatedBpm = Math.round(this.calculatedBpm * 0.7 + instantaneousBpm * 0.3);
          }
        }
      }
    } else {
      this.beatConfidence = Math.max(0, this.beatConfidence - 0.08);
    }

    return {
      isBeat,
      confidence: this.beatConfidence,
      bpm: this.calculatedBpm,
    };
  }

  public reset(): void {
    this.energyHistory = [];
    this.beatTimes = [];
    this.beatCutoffTime = 0;
    this.beatConfidence = 0;
    this.calculatedBpm = 120;
  }
}
