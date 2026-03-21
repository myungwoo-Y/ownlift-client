import {
  DEFAULT_SCHEDULED_DAYS,
  PROGRAM_WEEKDAY_OPTIONS,
  REQUIRED_SCHEDULED_DAYS,
  type ProgramParams,
  type ProgramWeekday,
} from "@ownlift/schemas";

const VALID_WEEKDAYS = new Set<string>(PROGRAM_WEEKDAY_OPTIONS);
const JS_DAY_TO_WEEKDAY: readonly ProgramWeekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export const WEEKDAY_SELECTION_ORDER = PROGRAM_WEEKDAY_OPTIONS;

export function normalizeScheduledDays(days: readonly string[]): ProgramWeekday[] {
  const selected = new Set<ProgramWeekday>();

  for (const day of days) {
    if (VALID_WEEKDAYS.has(day)) {
      selected.add(day as ProgramWeekday);
    }
  }

  return WEEKDAY_SELECTION_ORDER.filter((day) => selected.has(day));
}

export function getScheduledDaysOrDefault(days: readonly string[]): ProgramWeekday[] {
  const normalized = normalizeScheduledDays(days);
  return normalized.length > 0 ? normalized : [...DEFAULT_SCHEDULED_DAYS];
}

export function hasRequiredScheduledDays(days: readonly string[]): boolean {
  return normalizeScheduledDays(days).length === REQUIRED_SCHEDULED_DAYS;
}

export function getScheduledDayForIndex(index: number, days: readonly string[]): ProgramWeekday | null {
  return normalizeScheduledDays(days)[index] ?? null;
}

export function getTodayWeekday(date = new Date()): ProgramWeekday {
  return JS_DAY_TO_WEEKDAY[date.getDay()] ?? "mon";
}

export function isWorkoutAvailableToday(params: Pick<ProgramParams, "scheduleMode" | "scheduledDays">): boolean {
  if (params.scheduleMode !== "scheduled") {
    return true;
  }

  return getScheduledDaysOrDefault(params.scheduledDays).includes(getTodayWeekday());
}
