import { SchedulerHistoryItem } from './types';
import { SchedulerStorageManager } from './SchedulerStorageManager';

export class SchedulerHistoryManager {
  private static instance: SchedulerHistoryManager;
  private maxEntries: number = 40;

  private constructor() {
    const settings = SchedulerStorageManager.loadSettings();
    this.maxEntries = settings.maxHistoryEntries || 40;
  }

  public static getInstance(): SchedulerHistoryManager {
    if (!SchedulerHistoryManager.instance) {
      SchedulerHistoryManager.instance = new SchedulerHistoryManager();
    }
    return SchedulerHistoryManager.instance;
  }

  public getHistory(): SchedulerHistoryItem[] {
    return SchedulerStorageManager.loadHistory();
  }

  public recordActivation(
    wallpaperId: string,
    wallpaperName: string,
    reason: string,
    ruleId?: string,
    mode?: any,
    durationSeconds?: number
  ) {
    const item: SchedulerHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      wallpaperId,
      wallpaperName,
      reason,
      ruleId,
      mode,
      durationSeconds
    };

    SchedulerStorageManager.appendHistory(item, this.maxEntries);
  }

  public clear() {
    SchedulerStorageManager.clearHistory();
  }
}
