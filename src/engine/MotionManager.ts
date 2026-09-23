import { MotionData, MotionEventType, MotionCalibrationSettings } from '../types/engine';
import { SensorFusion } from './physics/SensorFusion';

export class MotionManager {
  private fusion: SensorFusion;

  constructor() {
    this.fusion = new SensorFusion();
  }

  public setSensitivity(sensitivity: number) {
    this.fusion.updateSettings({ sensitivity });
  }

  public setSmoothing(smoothing: number) {
    this.fusion.updateSettings({ smoothing });
  }

  public setEnabled(enabled: boolean) {
    this.fusion.updateSettings({ enabled });
  }

  public setReducedMotion(reducedMotion: boolean) {
    this.fusion.updateSettings({ reducedMotion });
  }

  public updateCalibration(settings: Partial<MotionCalibrationSettings>) {
    this.fusion.updateSettings(settings);
  }

  public calibrateCenter() {
    this.fusion.calibrateCenter();
  }

  public resetCalibration() {
    this.fusion.resetCalibration();
  }

  public getSettings(): MotionCalibrationSettings {
    return this.fusion.getSettings();
  }

  public async requestSensorPermission(): Promise<boolean> {
    return await this.fusion.requestSensorPermission();
  }

  public subscribeToEvents(listener: (event: MotionEventType) => void): () => void {
    return this.fusion.subscribe(listener);
  }

  public injectPointerFallback(normX: number, normY: number) {
    this.fusion.injectPointerFallback(normX, normY);
  }

  public update(delta: number = 0.016) {
    this.fusion.update(delta);
  }

  public getMotionData(): MotionData {
    return this.fusion.getMotionData();
  }

  public dispose() {
    this.fusion.dispose();
  }
}
