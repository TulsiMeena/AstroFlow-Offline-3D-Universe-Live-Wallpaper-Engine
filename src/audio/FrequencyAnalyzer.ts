import { AudioFrequencyBands } from './types';

export class FrequencyAnalyzer {
  private smoothedBands: AudioFrequencyBands = {
    subBass: 0,
    bass: 0,
    lowMid: 0,
    mid: 0,
    highMid: 0,
    presence: 0,
    treble: 0,
    brilliance: 0,
  };

  private smoothedVolume: number = 0;
  private smoothedBass: number = 0;
  private smoothedMid: number = 0;
  private smoothedTreble: number = 0;
  private smoothedEnergy: number = 0;

  // Adaptive peak tracking for dynamic auto-normalization without clipping
  private dynamicPeak: number = 40.0;

  /**
   * Analyze raw frequency bytes (0-255) from Web Audio AnalyserNode
   */
  public analyze(
    frequencies: Uint8Array<any>,
    timeDomain: Uint8Array<any>,
    sampleRate: number,
    smoothingFactor: number = 0.82
  ): {
    volume: number;
    bass: number;
    mid: number;
    treble: number;
    energy: number;
    bands: AudioFrequencyBands;
    bandArray: number[];
  } {
    const binCount = frequencies.length;
    if (binCount === 0) {
      return {
        volume: 0,
        bass: 0,
        mid: 0,
        treble: 0,
        energy: 0,
        bands: { ...this.smoothedBands },
        bandArray: [0, 0, 0, 0, 0, 0, 0, 0],
      };
    }

    const nyquist = sampleRate / 2;
    const hzPerBin = nyquist / binCount;

    // Helper to calculate average energy within a frequency range in Hz
    const getRangeEnergy = (lowHz: number, highHz: number): number => {
      const startBin = Math.max(0, Math.floor(lowHz / hzPerBin));
      const endBin = Math.min(binCount - 1, Math.ceil(highHz / hzPerBin));
      if (startBin >= endBin) return (frequencies[startBin] || 0) / 255.0;

      let sum = 0;
      for (let i = startBin; i <= endBin; i++) {
        sum += frequencies[i];
      }
      return sum / ((endBin - startBin + 1) * 255.0);
    };

    // Calculate raw energy in the standard audio spectral bands
    const rawSubBass = getRangeEnergy(20, 60);
    const rawBass = getRangeEnergy(60, 250);
    const rawLowMid = getRangeEnergy(250, 500);
    const rawMid = getRangeEnergy(500, 2000);
    const rawHighMid = getRangeEnergy(2000, 4000);
    const rawPresence = getRangeEnergy(4000, 6000);
    const rawTreble = getRangeEnergy(6000, 12000);
    const rawBrilliance = getRangeEnergy(12000, 20000);

    // Calculate RMS Volume from time domain waveform (128 is zero crossing)
    let sumSquares = 0;
    for (let i = 0; i < timeDomain.length; i++) {
      const val = (timeDomain[i] - 128) / 128.0;
      sumSquares += val * val;
    }
    const rawVolume = Math.min(1.0, Math.sqrt(sumSquares / timeDomain.length) * 2.5);

    // Composite primary spectrum groupings
    const targetBass = (rawSubBass * 1.3 + rawBass * 1.0) / 2.0;
    const targetMid = (rawLowMid + rawMid * 1.2 + rawHighMid) / 3.0;
    const targetTreble = (rawPresence + rawTreble * 1.2 + rawBrilliance) / 3.0;
    const targetEnergy = targetBass * 0.45 + targetMid * 0.35 + targetTreble * 0.2;

    // Update dynamic normalization peak with slow decay
    const currentMax = Math.max(targetEnergy, rawVolume);
    if (currentMax > this.dynamicPeak) {
      this.dynamicPeak = currentMax;
    } else {
      this.dynamicPeak = Math.max(0.15, this.dynamicPeak * 0.995);
    }

    const norm = 1.0 / Math.max(0.2, this.dynamicPeak);

    // Exponential Smoothing to eliminate visual pops and jitter
    const s = Math.max(0.1, Math.min(0.96, smoothingFactor));
    const invS = 1.0 - s;

    this.smoothedVolume = this.smoothedVolume * s + Math.min(1.0, rawVolume * norm) * invS;
    this.smoothedBass = this.smoothedBass * s + Math.min(1.0, targetBass * norm) * invS;
    this.smoothedMid = this.smoothedMid * s + Math.min(1.0, targetMid * norm) * invS;
    this.smoothedTreble = this.smoothedTreble * s + Math.min(1.0, targetTreble * norm) * invS;
    this.smoothedEnergy = this.smoothedEnergy * s + Math.min(1.0, targetEnergy * norm) * invS;

    this.smoothedBands.subBass = this.smoothedBands.subBass * s + Math.min(1.0, rawSubBass * norm) * invS;
    this.smoothedBands.bass = this.smoothedBands.bass * s + Math.min(1.0, rawBass * norm) * invS;
    this.smoothedBands.lowMid = this.smoothedBands.lowMid * s + Math.min(1.0, rawLowMid * norm) * invS;
    this.smoothedBands.mid = this.smoothedBands.mid * s + Math.min(1.0, rawMid * norm) * invS;
    this.smoothedBands.highMid = this.smoothedBands.highMid * s + Math.min(1.0, rawHighMid * norm) * invS;
    this.smoothedBands.presence = this.smoothedBands.presence * s + Math.min(1.0, rawPresence * norm) * invS;
    this.smoothedBands.treble = this.smoothedBands.treble * s + Math.min(1.0, rawTreble * norm) * invS;
    this.smoothedBands.brilliance = this.smoothedBands.brilliance * s + Math.min(1.0, rawBrilliance * norm) * invS;

    const bandArray = [
      this.smoothedBands.subBass,
      this.smoothedBands.bass,
      this.smoothedBands.lowMid,
      this.smoothedBands.mid,
      this.smoothedBands.highMid,
      this.smoothedBands.presence,
      this.smoothedBands.treble,
      this.smoothedBands.brilliance,
    ];

    return {
      volume: this.smoothedVolume,
      bass: this.smoothedBass,
      mid: this.smoothedMid,
      treble: this.smoothedTreble,
      energy: this.smoothedEnergy,
      bands: { ...this.smoothedBands },
      bandArray,
    };
  }

  public reset(): void {
    this.smoothedVolume = 0;
    this.smoothedBass = 0;
    this.smoothedMid = 0;
    this.smoothedTreble = 0;
    this.smoothedEnergy = 0;
    this.smoothedBands = {
      subBass: 0,
      bass: 0,
      lowMid: 0,
      mid: 0,
      highMid: 0,
      presence: 0,
      treble: 0,
      brilliance: 0,
    };
    this.dynamicPeak = 0.5;
  }
}
