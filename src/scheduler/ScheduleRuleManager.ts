import { TimeSlotConfig, DayOfWeek } from './types';
import { SchedulerStorageManager } from './SchedulerStorageManager';
import { TimeContextEngine } from './TimeContextEngine';
import { DayContextEngine } from './DayContextEngine';

export class ScheduleRuleManager {
  private static instance: ScheduleRuleManager;
  private slots: TimeSlotConfig[] = [];

  private constructor() {
    this.slots = SchedulerStorageManager.loadTimeSlots();
  }

  public static getInstance(): ScheduleRuleManager {
    if (!ScheduleRuleManager.instance) {
      ScheduleRuleManager.instance = new ScheduleRuleManager();
    }
    return ScheduleRuleManager.instance;
  }

  public getAllSlots(): TimeSlotConfig[] {
    return [...this.slots];
  }

  public getSlotById(id: string): TimeSlotConfig | null {
    return this.slots.find((s) => s.id === id) || null;
  }

  public createSlot(config: Omit<TimeSlotConfig, 'id'>): TimeSlotConfig {
    const newSlot: TimeSlotConfig = {
      ...config,
      id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    this.slots.push(newSlot);
    this.save();
    return newSlot;
  }

  public updateSlot(updated: TimeSlotConfig): boolean {
    const idx = this.slots.findIndex((s) => s.id === updated.id);
    if (idx === -1) return false;
    this.slots[idx] = { ...updated };
    this.save();
    return true;
  }

  public deleteSlot(id: string): boolean {
    const prev = this.slots.length;
    this.slots = this.slots.filter((s) => s.id !== id);
    if (this.slots.length !== prev) {
      this.save();
      return true;
    }
    return false;
  }

  public toggleSlot(id: string): boolean {
    const slot = this.getSlotById(id);
    if (!slot) return false;
    slot.enabled = !slot.enabled;
    this.save();
    return true;
  }

  /**
   * Evaluates the active time slot for the given local time & day.
   */
  public getActiveSlotForTime(
    hour: number,
    minute: number,
    day: DayOfWeek
  ): TimeSlotConfig | null {
    const enabledSlots = this.slots.filter((s) => s.enabled);

    for (const slot of enabledSlots) {
      const matchesDay = DayContextEngine.matchesDaySchedule(
        day,
        slot.daysType,
        slot.selectedDays
      );
      if (!matchesDay) continue;

      const inRange = TimeContextEngine.isTimeInRange(
        hour,
        minute,
        slot.startHour,
        slot.startMinute,
        slot.endHour,
        slot.endMinute
      );

      if (inRange) {
        return slot;
      }
    }

    return null;
  }

  /**
   * Determines the next chronological slot and seconds until it starts.
   */
  public getNextUpcomingSlot(
    currentHour: number,
    currentMinute: number,
    currentSecond: number,
    currentDay: DayOfWeek
  ): { nextSlot: TimeSlotConfig | null; secondsRemaining: number } {
    const enabledSlots = this.slots.filter((s) => s.enabled);
    if (enabledSlots.length === 0) {
      return { nextSlot: null, secondsRemaining: 0 };
    }

    let minSeconds = Infinity;
    let chosenSlot: TimeSlotConfig | null = null;

    for (const slot of enabledSlots) {
      const secUntil = TimeContextEngine.getSecondsUntil(
        currentHour,
        currentMinute,
        currentSecond,
        slot.startHour,
        slot.startMinute
      );

      if (secUntil > 0 && secUntil < minSeconds) {
        minSeconds = secUntil;
        chosenSlot = slot;
      }
    }

    return {
      nextSlot: chosenSlot,
      secondsRemaining: minSeconds === Infinity ? 0 : minSeconds
    };
  }

  private save() {
    SchedulerStorageManager.saveTimeSlots(this.slots);
  }
}
