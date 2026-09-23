import { EffectPowerState, PowerMode } from './types';
import { QualityConfig } from '../types/engine';

export class EffectPowerManager {
  private state: EffectPowerState = {
    particles: true,
    physics: true,
    bloom: true,
    motionBlur: false,
    fog: true,
    postProcessing: true,
    audioReactive: true,
    ecosystem: true,
    weather: true,
    cameraEffects: true,
    particleScale: 0.75,
    physicsStepDivider: 1,
    ecosystemSimulationRadius: 50
  };

  private physicsFrameCounter: number = 0;
  private audioSilenceCounter: number = 0;
  private audioIsSilent: boolean = false;
  private listeners: ((state: EffectPowerState) => void)[] = [];

  constructor() {}

  public setState(partial: Partial<EffectPowerState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  public getState(): EffectPowerState {
    return { ...this.state };
  }

  /**
   * Determine whether physics should calculate sub-steps on this frame
   */
  public shouldUpdatePhysics(): boolean {
    if (!this.state.physics) return false;
    this.physicsFrameCounter++;
    return this.physicsFrameCounter % this.state.physicsStepDivider === 0;
  }

  /**
   * Determines active particle count according to power state and quality config
   */
  public computeActiveParticleCount(baseCount: number, quality: QualityConfig): number {
    if (!this.state.particles) return 0;
    const capped = Math.min(baseCount, quality.maxParticleCount);
    return Math.max(100, Math.floor(capped * this.state.particleScale));
  }

  /**
   * Evaluates audio energy to put audio reactive analysis into low-power sleep on silence
   */
  public reportAudioEnergy(energy: number): boolean {
    if (!this.state.audioReactive) return false;

    if (energy < 0.015) {
      this.audioSilenceCounter++;
      if (this.audioSilenceCounter > 60) { // ~1 second of sustained silence
        this.audioIsSilent = true;
      }
    } else {
      this.audioSilenceCounter = 0;
      this.audioIsSilent = false;
    }

    return !this.audioIsSilent;
  }

  public isAudioInLowPowerSleep(): boolean {
    return this.audioIsSilent;
  }

  /**
   * Determines entity simulation fidelity based on distance
   */
  public getEntitySimulationRate(distanceFromCamera: number): 'FULL' | 'SIMPLIFIED' | 'SLEEP' {
    if (!this.state.ecosystem) return 'SLEEP';
    if (distanceFromCamera > this.state.ecosystemSimulationRadius) return 'SLEEP';
    if (distanceFromCamera > this.state.ecosystemSimulationRadius * 0.5) return 'SIMPLIFIED';
    return 'FULL';
  }

  public subscribe(fn: (state: EffectPowerState) => void): () => void {
    this.listeners.push(fn);
    fn(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify() {
    for (const fn of this.listeners) {
      fn(this.getState());
    }
  }
}
