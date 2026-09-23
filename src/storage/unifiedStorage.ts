import { WallpaperStorage, UserPreferences } from './wallpaperStorage';
import { ErrorManager } from '../diagnostics/ErrorManager';

export interface BackupPackageV1 {
  schemaVersion: number;
  appName: string;
  appVersion: string;
  exportedAt: number;
  preferences: UserPreferences;
  universeData?: Record<string, any>;
  schedulerData?: Record<string, any>;
  customWallpapers?: Record<string, any>;
  fusionData?: Record<string, any>;
}

export class UnifiedStorageManager {
  private static readonly CURRENT_SCHEMA_VERSION = 1;
  private static readonly MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024; // 5MB limit

  /**
   * Generates a complete offline JSON backup of all user preferences,
   * custom worlds, scheduler rules, and favorites.
   */
  public static createBackupPackage(): BackupPackageV1 {
    const prefs = WallpaperStorage.getPreferences();

    let universeData: any = null;
    let schedulerData: any = null;
    let customWallpapers: any = null;
    let fusionData: any = null;

    if (typeof localStorage !== 'undefined') {
      try {
        const u = localStorage.getItem('amit_hyperwall_personal_worlds');
        if (u) universeData = JSON.parse(u);

        const s = localStorage.getItem('amit_hyperwall_scheduler_storage_v1');
        if (s) schedulerData = JSON.parse(s);

        const c = localStorage.getItem('amit_hyperwall_custom_wallpapers');
        if (c) customWallpapers = JSON.parse(c);

        const f = localStorage.getItem('amit_hyperwall_fusion_vault');
        if (f) fusionData = JSON.parse(f);
      } catch (e) {
        console.warn('Error collecting sub-modules for backup:', e);
      }
    }

    return {
      schemaVersion: this.CURRENT_SCHEMA_VERSION,
      appName: 'Amit HyperWall',
      appVersion: '1.5.0',
      exportedAt: Date.now(),
      preferences: prefs,
      universeData,
      schedulerData,
      customWallpapers,
      fusionData
    };
  }

  /**
   * Exports backup package directly as a downloadable JSON file.
   */
  public static exportBackupToFile(): void {
    if (typeof window === 'undefined') return;

    try {
      const backup = this.createBackupPackage();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Amit_HyperWall_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      ErrorManager.getInstance().reportError({
        category: 'IMPORT_EXPORT',
        severity: 'ERROR',
        message: err?.message || 'Failed to export backup file',
        userFacingMessage: 'Could not export backup data to file.',
        recoverable: true
      });
    }
  }

  /**
   * Strictly validates and imports a backup package.
   * NEVER executes arbitrary code or scripts.
   */
  public static validateAndImport(jsonString: string): { success: boolean; message: string } {
    if (!jsonString || typeof jsonString !== 'string') {
      return { success: false, message: 'Invalid or empty backup data provided.' };
    }

    if (jsonString.length > this.MAX_IMPORT_SIZE_BYTES) {
      return { success: false, message: 'Import file exceeds safe 5MB limit.' };
    }

    // Security check: reject any occurrences of <script>, javascript:, or eval patterns
    if (/<script\b|javascript:|eval\s*\(|Function\s*\(/i.test(jsonString)) {
      ErrorManager.getInstance().reportError({
        category: 'IMPORT_EXPORT',
        severity: 'FATAL',
        message: 'Malicious executable payload detected in import file',
        userFacingMessage: 'Security violation: Import rejected because it contains executable script tags.',
        recoverable: true
      });
      return { success: false, message: 'Security check failed: import contains disallowed executable scripts.' };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { success: false, message: 'Malformed JSON syntax. File could not be parsed.' };
    }

    if (!parsed || typeof parsed !== 'object' || !parsed.preferences) {
      return { success: false, message: 'File is not a valid Amit HyperWall backup.' };
    }

    try {
      // Restore preferences
      WallpaperStorage.savePreferences(parsed.preferences);

      if (typeof localStorage !== 'undefined') {
        if (parsed.universeData && typeof parsed.universeData === 'object') {
          localStorage.setItem('amit_hyperwall_personal_worlds', JSON.stringify(parsed.universeData));
        }
        if (parsed.schedulerData && typeof parsed.schedulerData === 'object') {
          localStorage.setItem('amit_hyperwall_scheduler_storage_v1', JSON.stringify(parsed.schedulerData));
        }
        if (parsed.customWallpapers && typeof parsed.customWallpapers === 'object') {
          localStorage.setItem('amit_hyperwall_custom_wallpapers', JSON.stringify(parsed.customWallpapers));
        }
        if (parsed.fusionData && typeof parsed.fusionData === 'object') {
          localStorage.setItem('amit_hyperwall_fusion_vault', JSON.stringify(parsed.fusionData));
        }
      }

      return { success: true, message: 'Backup successfully restored. Engine refreshed.' };
    } catch (err: any) {
      return { success: false, message: `Import failed during persistence: ${err?.message}` };
    }
  }

  /**
   * Crash-safe state restoration helper:
   * Returns safe fallback state if corruption occurs.
   */
  public static getCrashSafeLastActiveId(): string {
    try {
      const prefs = WallpaperStorage.getPreferences();
      if (prefs.activeWallpaperId && typeof prefs.activeWallpaperId === 'string' && prefs.activeWallpaperId.length < 64) {
        return prefs.activeWallpaperId;
      }
    } catch {
      // Corrupted storage
    }
    return 'cosmic-particle-field';
  }
}
