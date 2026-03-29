import type { ProgramInstanceRecord, SessionStubRecord } from "@ownlift/db";
import type { MainLift, ProgramWeekday } from "@ownlift/schemas";

export interface MockHistoryItem extends SessionStubRecord {
  completedAt: string;
  totalVolume: number;
  estimatedOneRepMax: number;
  isMock: true;
}

const DEFAULT_TRAINING_DAYS: readonly ProgramWeekday[] = ["mon", "tue", "thu", "fri"];
const WEEKDAY_TO_OFFSET: Record<ProgramWeekday, number> = {
  mon: 0,
  tue: 1,
  wed: 2,
  thu: 3,
  fri: 4,
  sat: 5,
  sun: 6,
};

const E1RM_BASE_RATIO_BY_LIFT: Record<MainLift, number> = {
  squat: 1.075,
  bench: 1.07,
  deadlift: 1.085,
  press: 1.08,
};

const E1RM_GAIN_BY_LIFT: Record<MainLift, number> = {
  squat: 6,
  bench: 4,
  deadlift: 7,
  press: 3.5,
};

const VOLUME_FACTOR_BY_LIFT: Record<MainLift, number> = {
  squat: 27.5,
  bench: 22.5,
  deadlift: 25.5,
  press: 20.5,
};

const WEEK_E1RM_WAVE = [0.4, 1, 1.6, -0.6] as const;
const WEEK_VOLUME_MULTIPLIER = [1.02, 0.98, 0.92, 0.72] as const;
const SESSION_TIMES = [
  { hour: 18, minute: 10 },
  { hour: 19, minute: 0 },
  { hour: 18, minute: 40 },
  { hour: 19, minute: 30 },
] as const;

function getWeekStart(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
}

function addDays(date: Date, days: number): Date {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function getTrainingDayOffsets(instance: ProgramInstanceRecord): number[] {
  const sourceDays = instance.params.scheduledDays.length === 4
    ? instance.params.scheduledDays
    : DEFAULT_TRAINING_DAYS;

  return sourceDays
    .map((day) => WEEKDAY_TO_OFFSET[day])
    .sort((a, b) => a - b);
}

function getMockWeekIndex(weekPosition: number, weeksPerCycle: number): number {
  const offset = weeksPerCycle === 4 ? 1 : 0;
  return (weekPosition + offset) % weeksPerCycle;
}

export function buildMockHistoryItems(
  instance: ProgramInstanceRecord,
  totalWeeks = 8,
): MockHistoryItem[] {
  const weeksPerCycle = instance.params.includeDeload ? 4 : 3;
  const trainingDayOffsets = getTrainingDayOffsets(instance);
  const currentWeekStart = getWeekStart(new Date());
  const oldestWeekStart = addDays(currentWeekStart, -(totalWeeks - 1) * 7);
  const lastWeekIndex = Math.max(totalWeeks - 1, 1);

  return Array.from({ length: totalWeeks }, (_, weekPosition) => {
    const weekStart = addDays(oldestWeekStart, weekPosition * 7);
    const progressRatio = weekPosition / lastWeekIndex;
    const cycleIndex = -Math.ceil((totalWeeks - weekPosition) / weeksPerCycle);
    const weekIndex = getMockWeekIndex(weekPosition, weeksPerCycle);

    return instance.params.liftOrder.map((lift, dayIndex) => {
      const tm = instance.state.trainingMaxes[lift];
      const dayOffset = trainingDayOffsets[dayIndex] ?? dayIndex;
      const date = addDays(weekStart, dayOffset);
      const sessionTime = SESSION_TIMES[dayIndex] ?? SESSION_TIMES[0];
      date.setHours(sessionTime.hour, sessionTime.minute, 0, 0);

      const estimatedOneRepMax = roundToSingleDecimal(
        tm * E1RM_BASE_RATIO_BY_LIFT[lift]
          + E1RM_GAIN_BY_LIFT[lift] * progressRatio
          + (WEEK_E1RM_WAVE[weekIndex] ?? 0),
      );

      const totalVolume = Math.max(
        roundToNearest(
          tm * VOLUME_FACTOR_BY_LIFT[lift] * (WEEK_VOLUME_MULTIPLIER[weekIndex] ?? 0.85)
            + progressRatio * tm * 1.2
            + dayIndex * 25,
          5,
        ),
        tm * 8,
      );

      return {
        sessionId: `mock-history-${weekPosition}-${dayIndex}-${lift}`,
        instanceId: instance.instanceId,
        scheduledDate: date.toISOString(),
        cycleIndex,
        weekIndex,
        dayIndex,
        mainLiftKey: lift,
        status: "completed" as const,
        completedAt: date.toISOString(),
        totalVolume,
        estimatedOneRepMax,
        isMock: true as const,
      } satisfies MockHistoryItem;
    });
  })
    .flat()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
