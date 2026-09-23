import { GenerativeSoundCategory } from './types';

export class GenerativeSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeCategory: GenerativeSoundCategory = 'space';
  private isPlaying: boolean = false;
  private volume: number = 0.6;

  // Active audio nodes to stop on switch/dispose
  private activeNodes: (AudioNode | number)[] = [];
  private lfoIntervalId: number | null = null;

  constructor(audioCtx?: AudioContext | null) {
    if (audioCtx) {
      this.initNodes(audioCtx);
    }
  }

  public initNodes(ctx: AudioContext): void {
    this.ctx = ctx;
    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
  }

  public getOutputNode(): GainNode | null {
    return this.masterGain;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && this.isPlaying) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.15);
    }
  }

  public start(category?: GenerativeSoundCategory): void {
    if (category) {
      this.activeCategory = category;
    }
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.initNodes(new AudioCtxClass());
      }
    }
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.stopCurrentSound();
    this.isPlaying = true;

    // Build the procedural sound generator for active category
    this.buildSound(this.activeCategory);

    // Fade in master gain smoothly
    if (this.masterGain) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(
        Math.max(0.01, this.volume),
        this.ctx.currentTime + 0.8
      );
    }
  }

  public stop(): void {
    if (!this.isPlaying || !this.ctx || !this.masterGain) {
      this.isPlaying = false;
      this.stopCurrentSound();
      return;
    }

    // Fade out smoothly before cleaning up
    try {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
    } catch {}

    setTimeout(() => {
      this.stopCurrentSound();
      this.isPlaying = false;
    }, 450);
  }

  public setCategory(category: GenerativeSoundCategory): void {
    if (this.activeCategory === category && this.isPlaying) return;
    this.activeCategory = category;
    if (this.isPlaying) {
      this.start(category);
    }
  }

  public getCategory(): GenerativeSoundCategory {
    return this.activeCategory;
  }

  public isActive(): boolean {
    return this.isPlaying;
  }

  private stopCurrentSound(): void {
    if (this.lfoIntervalId !== null) {
      clearInterval(this.lfoIntervalId);
      this.lfoIntervalId = null;
    }

    for (const item of this.activeNodes) {
      if (typeof item === 'number') {
        clearTimeout(item);
      } else {
        try {
          if ('stop' in item && typeof (item as any).stop === 'function') {
            (item as any).stop();
          }
          item.disconnect();
        } catch {}
      }
    }
    this.activeNodes = [];
  }

  /**
   * Procedural Audio Synthesizers for 9 categories
   */
  private buildSound(category: GenerativeSoundCategory): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    switch (category) {
      case 'space': {
        // Space Ambience: Detuned Sub-Basses + High Resonance Dark Drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const subGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(43.65, now); // F1
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(44.2, now); // Slight detune for slow pulsing beat

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, now);

        subGain.gain.setValueAtTime(0.7, now);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(subGain);
        subGain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);

        // High shimmer drone
        const shimmerOsc = ctx.createOscillator();
        const shimmerGain = ctx.createGain();
        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(436.5, now);
        shimmerGain.gain.setValueAtTime(0.04, now);
        shimmerOsc.connect(shimmerGain);
        shimmerGain.connect(this.masterGain);
        shimmerOsc.start(now);

        this.activeNodes.push(osc1, osc2, subGain, filter, shimmerOsc, shimmerGain);
        break;
      }

      case 'ocean': {
        // Ocean Ambience: Filtered Pink Noise with periodic tidal wave swells
        const noiseNode = this.createNoiseNode(ctx, 3.0);
        const filter = ctx.createBiquadFilter();
        const waveGain = ctx.createGain();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);

        waveGain.gain.setValueAtTime(0.2, now);

        // LFO for surf wave surging (every ~6-8 seconds)
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.12, now); // ~8 sec period
        lfoGain.gain.setValueAtTime(260, now);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        noiseNode.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(this.masterGain);

        noiseNode.start(now);
        lfo.start(now);

        this.activeNodes.push(noiseNode, filter, waveGain, lfo, lfoGain);
        break;
      }

      case 'rain': {
        // Rain Ambience: Continuous droplet noise + high frequencies
        const rainNoise = this.createNoiseNode(ctx, 2.0);
        const bandpass = ctx.createBiquadFilter();
        const rainGain = ctx.createGain();

        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2800, now);
        bandpass.Q.setValueAtTime(0.8, now);

        rainGain.gain.setValueAtTime(0.35, now);

        rainNoise.connect(bandpass);
        bandpass.connect(rainGain);
        rainGain.connect(this.masterGain);
        rainNoise.start(now);

        // Periodic random water droplet clicks
        const triggerDrops = () => {
          if (!this.isPlaying || !this.ctx || !this.masterGain) return;
          const dropOsc = ctx.createOscillator();
          const dropGain = ctx.createGain();
          const dropTime = ctx.currentTime;
          const freq = 1200 + Math.random() * 2400;

          dropOsc.type = 'sine';
          dropOsc.frequency.setValueAtTime(freq, dropTime);
          dropOsc.frequency.exponentialRampToValueAtTime(freq * 0.4, dropTime + 0.08);

          dropGain.gain.setValueAtTime(0.06, dropTime);
          dropGain.gain.exponentialRampToValueAtTime(0.0001, dropTime + 0.08);

          dropOsc.connect(dropGain);
          dropGain.connect(this.masterGain);
          dropOsc.start(dropTime);
          dropOsc.stop(dropTime + 0.09);
        };

        this.lfoIntervalId = window.setInterval(triggerDrops, 180);
        this.activeNodes.push(rainNoise, bandpass, rainGain);
        break;
      }

      case 'wind': {
        // Wind Ambience: Resonant bandpass filter swept by slow random breeze LFO
        const windNoise = this.createNoiseNode(ctx, 4.0);
        const filter = ctx.createBiquadFilter();
        const windGain = ctx.createGain();

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(450, now);
        filter.Q.setValueAtTime(2.2, now);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.18, now);
        lfoGain.gain.setValueAtTime(350, now);
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        windGain.gain.setValueAtTime(0.4, now);

        windNoise.connect(filter);
        filter.connect(windGain);
        windGain.connect(this.masterGain);

        windNoise.start(now);
        lfo.start(now);

        this.activeNodes.push(windNoise, filter, windGain, lfo, lfoGain);
        break;
      }

      case 'forest': {
        // Forest Ambience: Soft foliage rustle + periodic procedural bird calls
        const rustle = this.createNoiseNode(ctx, 3.0);
        const rustleFilter = ctx.createBiquadFilter();
        const rustleGain = ctx.createGain();

        rustleFilter.type = 'lowpass';
        rustleFilter.frequency.setValueAtTime(700, now);
        rustleGain.gain.setValueAtTime(0.15, now);

        rustle.connect(rustleFilter);
        rustleFilter.connect(rustleGain);
        rustleGain.connect(this.masterGain);
        rustle.start(now);

        // Procedural bird chirp synthesis
        const chirpBird = () => {
          if (!this.isPlaying || !this.ctx || !this.masterGain) return;
          const t = ctx.currentTime;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const baseFreq = 2600 + Math.random() * 800;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(baseFreq, t);
          osc.frequency.linearRampToValueAtTime(baseFreq + 600, t + 0.05);
          osc.frequency.linearRampToValueAtTime(baseFreq - 300, t + 0.12);

          g.gain.setValueAtTime(0.04, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

          osc.connect(g);
          g.connect(this.masterGain);
          osc.start(t);
          osc.stop(t + 0.16);
        };

        this.lfoIntervalId = window.setInterval(chirpBird, 2400);
        this.activeNodes.push(rustle, rustleFilter, rustleGain);
        break;
      }

      case 'cyber': {
        // Cyber Ambience: Low synth drone with soft detune and square pulse arpeggio
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65.41, now); // C2

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, now);
        filter.Q.setValueAtTime(3.5, now);

        gain.gain.setValueAtTime(0.25, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);

        this.activeNodes.push(osc, filter, gain);
        break;
      }

      case 'energy': {
        // Energy Hum: 60Hz and 120Hz harmonics + electrical plasma fizz
        const hum1 = ctx.createOscillator();
        const hum2 = ctx.createOscillator();
        const humGain = ctx.createGain();

        hum1.type = 'sine';
        hum1.frequency.setValueAtTime(60, now);
        hum2.type = 'sine';
        hum2.frequency.setValueAtTime(120, now);

        humGain.gain.setValueAtTime(0.4, now);

        hum1.connect(humGain);
        hum2.connect(humGain);
        humGain.connect(this.masterGain);

        hum1.start(now);
        hum2.start(now);

        // High static hiss
        const hiss = this.createNoiseNode(ctx, 2.0);
        const hissFilter = ctx.createBiquadFilter();
        const hissGain = ctx.createGain();
        hissFilter.type = 'highpass';
        hissFilter.frequency.setValueAtTime(4500, now);
        hissGain.gain.setValueAtTime(0.05, now);
        hiss.connect(hissFilter);
        hissFilter.connect(hissGain);
        hissGain.connect(this.masterGain);
        hiss.start(now);

        this.activeNodes.push(hum1, hum2, humGain, hiss, hissFilter, hissGain);
        break;
      }

      case 'portal': {
        // Portal Ambience: Phased multi-chord drone with slow swirling pitch
        const freqs = [110, 164.81, 196, 246.94]; // A minor 7 chord
        const pFilter = ctx.createBiquadFilter();
        const pGain = ctx.createGain();

        pFilter.type = 'bandpass';
        pFilter.frequency.setValueAtTime(400, now);
        pFilter.Q.setValueAtTime(2.0, now);
        pGain.gain.setValueAtTime(0.3, now);

        freqs.forEach((f) => {
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, now);
          o.connect(pFilter);
          o.start(now);
          this.activeNodes.push(o);
        });

        // Modulation
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.2, now);
        lfoGain.gain.setValueAtTime(250, now);
        lfo.connect(lfoGain);
        lfoGain.connect(pFilter.frequency);
        lfo.start(now);

        pFilter.connect(pGain);
        pGain.connect(this.masterGain);

        this.activeNodes.push(pFilter, pGain, lfo, lfoGain);
        break;
      }

      case 'underwater': {
        // Underwater Ambience: Extreme low-pass muffled resonance
        const noise = this.createNoiseNode(ctx, 3.0);
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now);
        filter.Q.setValueAtTime(4.0, now);

        gain.gain.setValueAtTime(0.45, now);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);

        this.activeNodes.push(noise, filter, gain);
        break;
      }
    }
  }

  /**
   * Procedural White/Pink Noise AudioBufferSourceNode
   */
  private createNoiseNode(ctx: AudioContext, lengthSeconds: number): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * lengthSeconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      // White noise with pink noise integration
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;
    return noiseNode;
  }

  public dispose(): void {
    this.stop();
    this.activeNodes = [];
  }
}
