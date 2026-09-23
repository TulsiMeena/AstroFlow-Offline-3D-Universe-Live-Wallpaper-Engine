import { ErrorManager } from './ErrorManager';
import { QualityProfile } from '../types/engine';

export class RecoveryManager {
  private static instance: RecoveryManager | null = null;
  private isRecovering: boolean = false;
  private recoveryAttempts: number = 0;
  private maxAttempts: number = 3;

  public static getInstance(): RecoveryManager {
    if (!RecoveryManager.instance) {
      RecoveryManager.instance = new RecoveryManager();
    }
    return RecoveryManager.instance;
  }

  private constructor() {}

  /**
   * Called when WebGL context loss is detected.
   */
  public handleContextLoss(onRecoverySuccess?: () => void): void {
    if (this.isRecovering) return;
    this.isRecovering = true;
    this.recoveryAttempts++;

    ErrorManager.getInstance().reportError({
      category: 'WEBGL',
      severity: 'WARNING',
      message: `WebGL Context Lost (Attempt ${this.recoveryAttempts}/${this.maxAttempts})`,
      userFacingMessage: 'Graphics processor temporarily paused or reset. Attempting recovery...',
      recoverable: this.recoveryAttempts <= this.maxAttempts
    });

    if (this.recoveryAttempts > this.maxAttempts) {
      ErrorManager.getInstance().reportError({
        category: 'WEBGL',
        severity: 'FATAL',
        message: 'Exceeded maximum WebGL context recovery attempts.',
        userFacingMessage: '3D rendering is unavailable on this device/browser.',
        recoverable: false
      });
      this.isRecovering = false;
      return;
    }

    // Wait a brief moment for GPU driver to stabilize, then trigger reload callback
    setTimeout(() => {
      this.isRecovering = false;
      onRecoverySuccess?.();
    }, 600);
  }

  /**
   * Recommends safe low-performance settings after a crash.
   */
  public getEmergencySafeQuality(): QualityProfile {
    return 'LOW';
  }

  public resetRecoveryCounter(): void {
    this.recoveryAttempts = 0;
    this.isRecovering = false;
  }
}
