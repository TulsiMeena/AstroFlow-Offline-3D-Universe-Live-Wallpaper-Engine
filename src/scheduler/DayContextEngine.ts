import { DayOfWeek, DayScheduleType } from './types';

export class DayContextEngine {
  private static readonly DAY_NAMES = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];

  private static readonly SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  public static getCurrentDayOfWeek(): DayOfWeek {
    const day = new Date().getDay();
    return day as DayOfWeek;
  }

  public static getDayName(day: DayOfWeek): string {
    return this.DAY_NAMES[day] || 'Unknown';
  }

  public static getShortDayName(day: DayOfWeek): string {
    return this.SHORT_DAY_NAMES[day] || '';
  }

  public static isWeekday(day: DayOfWeek): boolean {
    return day >= 1 && day <= 5;
  }

  public static isWeekend(day: DayOfWeek): boolean {
    return day === 0 || day === 6;
  }

  public static matchesDaySchedule(
    currentDay: DayOfWeek,
    scheduleType: DayScheduleType,
    customDays: DayOfWeek[]
  ): boolean {
    switch (scheduleType) {
      case 'EVERY_DAY':
        return true;
      case 'WEEKDAYS':
        return this.isWeekday(currentDay);
      case 'WEEKENDS':
        return this.isWeekend(currentDay);
      case 'CUSTOM':
        return customDays.includes(currentDay);
      default:
        return true;
    }
  }
}
