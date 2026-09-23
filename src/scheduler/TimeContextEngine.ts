import { BuiltinTimePeriod } from './types';

export class TimeContextEngine {
  public static getCurrentLocalTime(): {
    hours: number;
    minutes: number;
    seconds: number;
    formattedTime: string;
    totalMinutes: number;
  } {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const totalMinutes = hours * 60 + minutes;

    return { hours, minutes, seconds, formattedTime, totalMinutes };
  }

  public static getBuiltinPeriod(hours: number): BuiltinTimePeriod {
    if (hours >= 6 && hours < 10) return 'MORNING';
    if (hours >= 10 && hours < 17) return 'DAY';
    if (hours >= 17 && hours < 20) return 'EVENING';
    if (hours >= 20 && hours < 24) return 'NIGHT';
    return 'LATE_NIGHT'; // 00:00 - 05:59
  }

  /**
   * Checks whether the given time falls within [startHour:startMinute, endHour:endMinute).
   * Supports midnight wraparound (e.g., 22:00 to 06:00).
   */
  public static isTimeInRange(
    currentHour: number,
    currentMinute: number,
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number
  ): boolean {
    const current = currentHour * 60 + currentMinute;
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;

    if (start === end) {
      // 24 hour slot
      return true;
    }

    if (start < end) {
      // Same-day range
      return current >= start && current < end;
    } else {
      // Overnight range crossing midnight
      return current >= start || current < end;
    }
  }

  /**
   * Computes seconds remaining until a given target time (endHour:endMinute) from current time.
   */
  public static getSecondsUntil(
    currentHour: number,
    currentMinute: number,
    currentSecond: number,
    targetHour: number,
    targetMinute: number
  ): number {
    const currentTotalSec = currentHour * 3600 + currentMinute * 60 + currentSecond;
    let targetTotalSec = targetHour * 3600 + targetMinute * 60;

    if (targetTotalSec <= currentTotalSec) {
      targetTotalSec += 24 * 3600; // Next day
    }

    return targetTotalSec - currentTotalSec;
  }
}
