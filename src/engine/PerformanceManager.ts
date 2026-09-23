import { RenderStats, GPUInfo } from '../types/engine';
import { detectGPU } from '../utils/gpuDetector';

export class PerformanceManager {
  private fps: number = 60;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private lastFpsUpdateTime: number = performance.now();
  private frameTime: number = 16.6;
  private consecutiveLowFpsCount: number = 0;
  private gpuInfo: GPUInfo;

  // Callback to suggest quality downgrade if sustained low FPS
  private onLowPerformanceCallback?: () => void;

  constructor(onLowPerformance?: () => void) {
    this.gpuInfo = detectGPU();
    this.onLowPerformanceCallback = onLowPerformance;
  }

  public getGPUInfo(): GPUInfo {
    return this.gpuInfo;
  }

  public beginFrame(): number {
    return performance.now();
  }

  public endFrame(startTime: number, drawCalls: number, triangles: number, points: number, particleCount: number): RenderStats {
    const now = performance.now();
    this.frameTime = now - startTime;
    this.frameCount++;

    if (now - this.lastFpsUpdateTime >= 500) {
      const deltaSec = (now - this.lastFpsUpdateTime) / 1000;
      this.fps = Math.round(this.frameCount / deltaSec);
      this.frameCount = 0;
      this.lastFpsUpdateTime = now;

      // Check for prolonged low FPS (< 28 FPS for 4 consecutive intervals)
      if (this.fps < 28 && this.fps > 0) {
        this.consecutiveLowFpsCount++;
        if (this.consecutiveLowFpsCount >= 4) {
          this.consecutiveLowFpsCount = 0;
          this.onLowPerformanceCallback?.();
        }
      } else {
        this.consecutiveLowFpsCount = 0;
      }
    }

    return {
      fps: Math.min(Math.max(this.fps, 0), 120),
      frameTime: Number(this.frameTime.toFixed(1)),
      drawCalls,
      triangles,
      points,
      particleCount
    };
  }

  public getFPS(): number {
    return this.fps;
  }

  public getFrameTime(): number {
    return this.frameTime;
  }
}
