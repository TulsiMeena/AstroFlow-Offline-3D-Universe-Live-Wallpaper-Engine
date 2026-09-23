import {
  TimeSlotConfig,
  WallpaperSet,
  AutomationRule,
  SchedulerSettings,
  SchedulerHistoryItem
} from './types';

const STORAGE_KEYS = {
  SETTINGS: 'amit_hyperwall_scheduler_settings_v1',
  TIME_SLOTS: 'amit_hyperwall_scheduler_slots_v1',
  SETS: 'amit_hyperwall_scheduler_sets_v1',
  RULES: 'amit_hyperwall_scheduler_rules_v1',
  HISTORY: 'amit_hyperwall_scheduler_history_v1'
};

const DEFAULT_SETTINGS: SchedulerSettings = {
  enabled: true,
  timeSchedulingEnabled: true,
  batteryRulesEnabled: true,
  chargingRulesEnabled: true,
  randomRotationEnabled: false,
  respectBatterySaver: true,
  respectReducedMotion: true,
  allowHighQualityWhileCharging: true,
  defaultTransition: 'crossfade',
  defaultTransitionDuration: 1.0,
  defaultRotationIntervalMinutes: 15,
  rotationMode: 'SCHEDULED',
  defaultRulePriority: 50,
  maxHistoryEntries: 40,
  schemaVersion: 1
};

export class SchedulerStorageManager {
  // 1. Settings
  public static loadSettings(): SchedulerSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!raw) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  public static saveSettings(settings: SchedulerSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to save settings', e);
    }
  }

  // 2. Time Slots
  public static loadTimeSlots(): TimeSlotConfig[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TIME_SLOTS);
      if (raw) {
        const slots = JSON.parse(raw);
        if (Array.isArray(slots) && slots.length > 0) {
          return slots;
        }
      }
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to load time slots, using defaults', e);
    }
    const defaults = this.getDefaultTimeSlots();
    this.saveTimeSlots(defaults);
    return defaults;
  }

  public static saveTimeSlots(slots: TimeSlotConfig[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.TIME_SLOTS, JSON.stringify(slots));
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to save time slots', e);
    }
  }

  public static getDefaultTimeSlots(): TimeSlotConfig[] {
    return [
      {
        id: 'slot-morning',
        name: 'Morning Glow',
        period: 'MORNING',
        startHour: 6,
        startMinute: 0,
        endHour: 10,
        endMinute: 0,
        targetWallpaperId: 'aurora-borealis',
        daysType: 'EVERY_DAY',
        selectedDays: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        color: '#00FFA3'
      },
      {
        id: 'slot-day',
        name: 'Day Productivity',
        period: 'DAY',
        startHour: 10,
        startMinute: 0,
        endHour: 17,
        endMinute: 0,
        targetWallpaperId: 'cyber-grid',
        daysType: 'EVERY_DAY',
        selectedDays: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        color: '#00F0FF'
      },
      {
        id: 'slot-evening',
        name: 'Evening Sunset',
        period: 'EVENING',
        startHour: 17,
        startMinute: 0,
        endHour: 20,
        endMinute: 0,
        targetWallpaperId: 'ocean-tide',
        daysType: 'EVERY_DAY',
        selectedDays: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        color: '#FF007F'
      },
      {
        id: 'slot-night',
        name: 'Night Universe',
        period: 'NIGHT',
        startHour: 20,
        startMinute: 0,
        endHour: 24,
        endMinute: 0,
        targetWallpaperId: 'galaxy-core',
        daysType: 'EVERY_DAY',
        selectedDays: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        color: '#7000FF'
      },
      {
        id: 'slot-latenight',
        name: 'Late Night Deep Space',
        period: 'LATE_NIGHT',
        startHour: 0,
        startMinute: 0,
        endHour: 6,
        endMinute: 0,
        targetWallpaperId: 'black-hole',
        daysType: 'EVERY_DAY',
        selectedDays: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        color: '#3B82F6'
      }
    ];
  }

  // 3. Wallpaper Sets
  public static loadSets(): WallpaperSet[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETS);
      if (raw) {
        const sets = JSON.parse(raw);
        if (Array.isArray(sets) && sets.length > 0) {
          return sets;
        }
      }
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to load sets, using defaults', e);
    }
    const defaults = this.getDefaultSets();
    this.saveSets(defaults);
    return defaults;
  }

  public static saveSets(sets: WallpaperSet[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETS, JSON.stringify(sets));
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to save sets', e);
    }
  }

  public static getDefaultSets(): WallpaperSet[] {
    return [
      {
        id: 'set-cosmic-pack',
        name: 'Cosmic Pack',
        description: 'Vast nebulae, black holes and relativistic particle fields.',
        wallpaperIds: ['galaxy-core', 'black-hole', 'cosmic-particle-field', 'procedural-universe'],
        createdAt: Date.now() - 300000,
        updatedAt: Date.now() - 300000,
        isFavorite: true,
        shuffle: false,
        currentPlaybackIndex: 0,
        color: '#7000FF'
      },
      {
        id: 'set-nature-pack',
        name: 'Nature Pack',
        description: 'Organic terrain, ocean waters and dynamic procedural weather.',
        wallpaperIds: ['aurora-borealis', 'ocean-tide', 'cyber-grid'],
        createdAt: Date.now() - 200000,
        updatedAt: Date.now() - 200000,
        isFavorite: true,
        shuffle: false,
        currentPlaybackIndex: 0,
        color: '#00FFA3'
      },
      {
        id: 'set-night-pack',
        name: 'Night Pack',
        description: 'AMOLED dark backgrounds engineered for zero eye strain.',
        wallpaperIds: ['black-hole', 'galaxy-core', 'cosmic-particle-field'],
        createdAt: Date.now() - 100000,
        updatedAt: Date.now() - 100000,
        isFavorite: false,
        shuffle: true,
        currentPlaybackIndex: 0,
        color: '#1E293B'
      }
    ];
  }

  // 4. Automation Rules
  public static loadRules(): AutomationRule[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RULES);
      if (raw) {
        const rules = JSON.parse(raw);
        if (Array.isArray(rules) && rules.length > 0) {
          return rules;
        }
      }
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to load rules, using defaults', e);
    }
    const defaults = this.getDefaultRules();
    this.saveRules(defaults);
    return defaults;
  }

  public static saveRules(rules: AutomationRule[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules));
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to save rules', e);
    }
  }

  public static getDefaultRules(): AutomationRule[] {
    return [
      {
        id: 'rule-low-battery',
        name: 'Low Battery AMOLED Saver',
        description: 'Automatically activates Battery Saver & dark black hole wallpaper when battery drops below 20%.',
        enabled: true,
        priority: 90,
        logicOperator: 'AND',
        conditions: [
          {
            id: 'c-battery-low',
            variable: 'BATTERY_LEVEL',
            operator: 'LESS_THAN',
            value: 0.20
          }
        ],
        action: {
          type: 'SET_SPECIAL_MODE',
          targetId: 'BATTERY_SAVER',
          transition: 'fade',
          transitionDuration: 1.0,
          label: 'Battery Saver Mode'
        },
        cooldownSeconds: 30,
        category: 'BATTERY'
      },
      {
        id: 'rule-charging-boost',
        name: 'Charging Energy Boost',
        description: 'Enables high quality and energetic procedural effects when plugged into power.',
        enabled: true,
        priority: 75,
        logicOperator: 'AND',
        conditions: [
          {
            id: 'c-is-charging',
            variable: 'IS_CHARGING',
            operator: 'EQUALS',
            value: true
          }
        ],
        action: {
          type: 'SET_SPECIAL_MODE',
          targetId: 'CHARGING',
          transition: 'energy',
          transitionDuration: 1.0,
          label: 'Charging Mode'
        },
        cooldownSeconds: 30,
        category: 'CHARGING'
      },
      {
        id: 'rule-weekend-nature',
        name: 'Weekend Nature Vibes',
        description: 'Switches to Nature Pack on Saturday and Sunday.',
        enabled: true,
        priority: 40,
        logicOperator: 'OR',
        conditions: [
          {
            id: 'c-day-sat',
            variable: 'DAY_OF_WEEK',
            operator: 'EQUALS',
            value: 6 // Saturday
          },
          {
            id: 'c-day-sun',
            variable: 'DAY_OF_WEEK',
            operator: 'EQUALS',
            value: 0 // Sunday
          }
        ],
        action: {
          type: 'ACTIVATE_SET',
          targetId: 'set-nature-pack',
          transition: 'crossfade',
          transitionDuration: 1.5,
          label: 'Nature Pack'
        },
        cooldownSeconds: 60,
        category: 'CUSTOM'
      }
    ];
  }

  // 5. History Log
  public static loadHistory(): SchedulerHistoryItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (raw) {
        const hist = JSON.parse(raw);
        if (Array.isArray(hist)) return hist;
      }
    } catch {}
    return [];
  }

  public static appendHistory(item: SchedulerHistoryItem, maxEntries: number = 40) {
    try {
      const current = this.loadHistory();
      const updated = [item, ...current].slice(0, maxEntries);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[SchedulerStorage] Failed to append history', e);
    }
  }

  public static clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch {}
  }
}
