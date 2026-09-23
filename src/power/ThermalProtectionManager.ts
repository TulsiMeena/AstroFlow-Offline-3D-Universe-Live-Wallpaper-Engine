import { ThermalState, SmartFPSTarget } from './types';

export class ThermalProtectionManager {
  private state: ThermalState = 'NOMINAL';
  private consecutiveHeavyFrames: number = 0;
  private consecutiveNominalFrames: number = 0;
  private frameTimes: number[] = [];
  private readonly SAMPLE_SIZE = 30;
  private listeners: ((state: ThermalState, recommendations: ThermalRecommendations) => void)[] = [];

  constructor() {}

  public recordFrameTime(frameDurationMs: number) {
    this.frameTimes.push(frameDurationMs);
    if (this.frameTimes.length > this.SAMPLE_SIZE) {
      this.frameTimes.shift();
    }

    // Heavy frame threshold: > 35ms (~ < 28 FPS)
    // Critical frame threshold: > 55ms (~ < 18 FPS)
    if (frameDurationMs > 35) {
      this.consecutiveHeavyFrames++;
      this.consecutiveNominalFrames = 0;
    } else if (frameDurationMs < 22) {
      this.consecutiveNominalFrames++;
      this.consecutiveHeavyFrames = Math.max(0, this.consecutiveHeavyFrames - 1);
    }

    // Evaluate state
    if (this.consecutiveHeavyFrames >= 18) {
      this.transitionTo('CRITICAL');
    } else if (this.consecutiveHeavyFrames >= 8) {
      this.transitionTo('ELEVATED');
    } else if (this.consecutiveNominalFrames >= 40) {
      // Gradual recovery
      if (this.state === 'CRITICAL') {
        this.transitionTo('ELEVATED');
        this.consecutiveNominalFrames = 0;
      } else if (this.state === 'ELEVATED') {
        this.transitionTo('NOMINAL');
        this.consecutiveNominalFrames = 0;
      }
    }
  }

  private transitionTo(newState: ThermalState) {
    if (this.state !== newState) {
      this.state = newState;
      this.notify();
    }
  }

  public getState(): ThermalState {
    return this.state;
  }

  public getRecommendations(): ThermalRecommendations {
    switch (this.state) {
      case 'CRITICAL':
        return {
          suggestedFPS: 20,
          particleScale: 0.35,
          disablePostProcessing: true,
          disableBloom: true,
          physicsDivider: 3,
          resolutionScale: 0.75,
          ecosystemReduced: true,
          statusNote: 'Thermal workload reduction active: Heavy rendering load detected by frame timing.'
        };
      case 'ELEVATED':
        return {
          suggestedFPS: 30,
          particleScale: 0.6,
          disablePostProcessing: false,
          disableBloom: false,
          physicsDivider: 2,
          resolutionScale: 0.9,
          ecosystemReduced: true,
          statusNote: 'Thermal moderation active: Compensating for elevated device workload.'
        };
      case 'NOMINAL':
      default:
        return {
          suggestedFPS: null,
          particleScale: 1.0,
          disablePostProcessing: false,
          disableBloom: false,
          physicsDivider: 1,
          resolutionScale: 1.0,
          ecosystemReduced: false,
          statusNote: 'Thermal load nominal: Full configured headroom available.'
        };
    }
  }

  public subscribe(fn: (state: ThermalState, recommendations: ThermalRecommendations) => void): () => void {
    this.listeners.push(fn);
    fn(this.state, this.getRecommendations());
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    const recs = this.getRecommendations();
    for (const fn of this.listeners) {
      fn(this.state, recs);
    }
  }

  public reset() {
    this.consecutiveHeavyFrames = 0;
    this.consecutiveNominalFrames = 0;
    this.frameTimes = [];
    this.transitionTo('NOMINAL');
  }
}

export interface ThermalRecommendations {
  suggestedFPS: SmartFPSTarget | null;
  particleScale: number;
  disablePostProcessing: boolean;
  disableBloom: boolean;
  physicsDivider: number;
  resolutionScale: number;
  ecosystemReduced: boolean;
  statusNote: string;
}
