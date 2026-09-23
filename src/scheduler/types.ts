import { QualityProfile } from '../types/engine';
import { PowerMode } from '../power/types';

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ... 6 = Saturday

export type DayScheduleType = 'EVERY_DAY' | 'WEEKDAYS' | 'WEEKENDS' | 'CUSTOM';

export type BuiltinTimePeriod = 'MORNING' | 'DAY' | 'EVENING' | 'NIGHT' | 'LATE_NIGHT' | 'CUSTOM';

export type TransitionType =
  | 'crossfade'
  | 'smooth_camera'
  | 'particle_dissolve'
  | 'portal'
  | 'energy'
  | 'fade'
  | 'instant';

export type RotationMode =
  | 'MANUAL'
  | 'FIXED_INTERVAL'
  | 'SCHEDULED'
  | 'RANDOM'
  | 'SEQUENTIAL'
  | 'SMART';

export type AutomationMode =
  | 'NONE'
  | 'MORNING'
  | 'DAY'
  | 'SUNSET'
  | 'NIGHT'
  | 'BATTERY_SAVER'
  | 'CHARGING'
  | 'RANDOM_UNIVERSE';

export interface TimeSlotConfig {
  id: string;
  name: string;
  period: BuiltinTimePeriod;
  startHour: number; // 0-23
  startMinute: number; // 0-59
  endHour: number; // 0-23
  endMinute: number; // 0-59
  targetWallpaperId: string;
  targetSetName?: string;
  daysType: DayScheduleType;
  selectedDays: DayOfWeek[];
  enabled: boolean;
  color: string;
}

export interface WallpaperSet {
  id: string;
  name: string;
  description: string;
  wallpaperIds: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  shuffle: boolean;
  currentPlaybackIndex: number;
  categoryTag?: string;
  color?: string;
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'LESS_THAN'
  | 'GREATER_THAN'
  | 'IN_RANGE'
  | 'CONTAINS';

export type ConditionVariable =
  | 'BATTERY_LEVEL'
  | 'IS_CHARGING'
  | 'CURRENT_TIME'
  | 'DAY_OF_WEEK'
  | 'APP_VISIBILITY'
  | 'POWER_MODE'
  | 'PERFORMANCE_TIER';

export interface RuleCondition {
  id: string;
  variable: ConditionVariable;
  operator: ConditionOperator;
  value: any;
  secondaryValue?: any; // For IN_RANGE
}

export type RuleActionType =
  | 'ACTIVATE_WALLPAPER'
  | 'ACTIVATE_SET'
  | 'SET_SPECIAL_MODE'
  | 'SET_POWER_MODE'
  | 'SET_QUALITY';

export interface RuleAction {
  type: RuleActionType;
  targetId: string; // Wallpaper ID, Set ID, PowerMode, etc.
  transition?: TransitionType;
  transitionDuration?: number;
  label?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number; // Higher number = higher priority
  logicOperator: 'AND' | 'OR';
  conditions: RuleCondition[];
  action: RuleAction;
  cooldownSeconds: number; // Anti-looping cooldown
  lastTriggered?: number;
  category: 'BATTERY' | 'TIME' | 'CHARGING' | 'CUSTOM' | 'PERFORMANCE';
}

export interface ContextState {
  currentTime: string; // HH:mm:ss
  currentHour: number;
  currentMinute: number;
  dayOfWeek: DayOfWeek;
  dayName: string;
  // Battery State (Never faked)
  isBatterySupported: boolean;
  batteryLevel: number | null; // 0.0 to 1.0
  isCharging: boolean | null;
  batteryStatusMessage: string;
  // Application State
  isAppVisible: boolean;
  motionAvailable: boolean;
  audioAvailable: boolean;
  performanceTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA';
  powerMode: PowerMode;
  // Scheduler State
  activeMode: AutomationMode;
  activeRuleId: string | null;
  activeRuleName: string | null;
  activeWallpaperId: string;
  nextChangeTime: string | null;
  nextWallpaperId: string | null;
  nextWallpaperName: string | null;
  timeRemainingSeconds: number | null;
  activeConflicts: string[];
}

export interface SchedulerHistoryItem {
  id: string;
  timestamp: number;
  wallpaperId: string;
  wallpaperName: string;
  reason: string;
  ruleId?: string;
  mode?: AutomationMode;
  durationSeconds?: number;
}

export interface SchedulerSettings {
  enabled: boolean;
  timeSchedulingEnabled: boolean;
  batteryRulesEnabled: boolean;
  chargingRulesEnabled: boolean;
  randomRotationEnabled: boolean;
  respectBatterySaver: boolean;
  respectReducedMotion: boolean;
  allowHighQualityWhileCharging: boolean;
  defaultTransition: TransitionType;
  defaultTransitionDuration: number; // seconds
  defaultRotationIntervalMinutes: number;
  rotationMode: RotationMode;
  defaultRulePriority: number;
  maxHistoryEntries: number;
  schemaVersion: number;
}

export interface TransitionState {
  isTransitioning: boolean;
  type: TransitionType;
  progress: number; // 0.0 to 1.0
  duration: number; // seconds
  fromWallpaperId: string | null;
  toWallpaperId: string | null;
}
