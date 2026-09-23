import { TransitionType, TransitionState } from './types';
import { DeviceStateAdapter } from './DeviceStateAdapter';

export type TransitionCallback = (state: TransitionState) => void;

export class TransitionScheduler {
  private static instance: TransitionScheduler;
  private state: TransitionState = {
    isTransitioning: false,
    type: 'crossfade',
    progress: 0,
    duration: 1.0,
    fromWallpaperId: null,
    toWallpaperId: null
  };
  private callbacks: Set<TransitionCallback> = new Set();
  private animationFrameId: number | null = null;

  private constructor() {}

  public static getInstance(): TransitionScheduler {
    if (!TransitionScheduler.instance) {
      TransitionScheduler.instance = new TransitionScheduler();
    }
    return TransitionScheduler.instance;
  }

  public subscribe(cb: TransitionCallback): () => void {
    this.callbacks.add(cb);
    cb(this.state);
    return () => {
      this.callbacks.delete(cb);
    };
  }

  public getState(): TransitionState {
    return { ...this.state };
  }

  /**
   * Triggers a transition between two wallpapers with specified effect.
   */
  public executeTransition(
    fromId: string | null,
    toId: string,
    requestedType: TransitionType = 'crossfade',
    requestedDuration: number = 1.0,
    onComplete?: () => void
  ) {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const adapter = DeviceStateAdapter.getInstance();
    const isReduced = adapter.getIsReducedMotion();

    let finalType: TransitionType = requestedType;
    let finalDuration: number = requestedDuration;

    // Accessibility constraint: Reduced Motion
    if (isReduced) {
      finalType = 'fade';
      finalDuration = Math.min(requestedDuration, 0.3);
    }

    if (finalType === 'instant' || finalDuration <= 0) {
      this.state = {
        isTransitioning: false,
        type: 'instant',
        progress: 1.0,
        duration: 0,
        fromWallpaperId: fromId,
        toWallpaperId: toId
      };
      this.notify();
      onComplete?.();
      return;
    }

    this.state = {
      isTransitioning: true,
      type: finalType,
      progress: 0,
      duration: finalDuration,
      fromWallpaperId: fromId,
      toWallpaperId: toId
    };
    this.notify();

    const startTime = performance.now();
    const durationMs = finalDuration * 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / durationMs);

      this.state.progress = progress;
      this.notify();

      if (progress < 1.0) {
        this.animationFrameId = requestAnimationFrame(tick);
      } else {
        this.state.isTransitioning = false;
        this.notify();
        this.animationFrameId = null;
        onComplete?.();
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }

  private notify() {
    this.callbacks.forEach((cb) => cb({ ...this.state }));
  }
}
