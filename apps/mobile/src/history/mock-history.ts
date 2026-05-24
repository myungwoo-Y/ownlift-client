import { prescribe } from "@ownlift/core";
import type {
  ProgramInstanceRecord,
  SessionStubRecord,
  SetLogRecord,
  WorkoutResultRecord,
} from "@ownlift/db";
import type {
  MainLift,
  PrescriptionData,
  PrescriptionSet,
} from "@ownlift/schemas";
import type { HistoryLastWorkSetMetric } from "./history-screen/types";

export interface MockHistoryItem extends SessionStubRecord {
  completedAt: string;
  totalVolume: number;
  estimatedOneRepMax: number;
  lastWorkSet: HistoryLastWorkSetMetric;
  isMock: true;
}

type MockWeekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DEFAULT_TRAINING_DAYS: readonly MockWeekday[] = ["mon", "tue", "thu", "fri"];
const MOCK_HISTORY_START_YEAR = 2025;
const MOCK_HISTORY_START_MONTH_INDEX = 0;
const RECENT_MOCK_HISTORY_WEEKS = 8;
const WEEKDAY_TO_OFFSET: Record<MockWeekday, number> = {
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
const LAST_WORK_SET_REPS_BY_WEEK = [8, 6, 4, 5] as const;
const SESSION_TIMES = [
  { hour: 18, minute: 10 },
  { hour: 19, minute: 0 },
  { hour: 18, minute: 40 },
  { hour: 19, minute: 30 },
] as const;

interface MockHistoryPeriod {
  key: string;
  weekStart: Date;
}

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

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatMonthKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
  ].join("-");
}

function roundToNearest(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function getMockPrescription(
  instance: ProgramInstanceRecord,
  item: Pick<MockHistoryItem, "weekIndex" | "mainLiftKey">,
): PrescriptionData {
  return prescribe({
    params: instance.params,
    state: instance.state,
    weekIndex: item.weekIndex,
    mainLift: item.mainLiftKey,
  });
}

function getLastWorkSet(sets: readonly PrescriptionSet[]): PrescriptionSet | null {
  return sets.filter((set) => !set.isWarmup).at(-1) ?? null;
}

function buildMockLastWorkSet(
  instance: ProgramInstanceRecord,
  item: Pick<MockHistoryItem, "weekIndex" | "mainLiftKey">,
): HistoryLastWorkSetMetric {
  const prescription = getMockPrescription(instance, item);
  const lastWorkSet = getLastWorkSet(prescription.sets);

  return {
    weight: lastWorkSet?.targetWeight ?? instance.state.trainingMaxes[item.mainLiftKey],
    reps: LAST_WORK_SET_REPS_BY_WEEK[item.weekIndex] ?? LAST_WORK_SET_REPS_BY_WEEK[0],
  };
}

function getSetType(set: PrescriptionSet): SetLogRecord["setType"] {
  if (set.isWarmup) return "warmup";
  return set.isAmrap ? "amrap" : "work";
}

function buildMockSetLogs(
  item: MockHistoryItem,
  prescription: PrescriptionData,
): SetLogRecord[] {
  const lastWorkSetOrder = getLastWorkSet(prescription.sets)?.setOrder ?? null;

  return prescription.sets.map((set) => {
    const isLastWorkSet = set.setOrder === lastWorkSetOrder;

    return {
      id: `${item.sessionId}-set-${set.setOrder}`,
      sessionId: item.sessionId,
      exerciseId: `${item.sessionId}-${item.mainLiftKey}`,
      setType: getSetType(set),
      setOrder: set.setOrder,
      planned: {
        targetWeight: set.targetWeight,
        targetReps: set.targetReps,
        percentage: set.percentage,
      },
      actualWeight: set.targetWeight,
      actualReps: isLastWorkSet ? item.lastWorkSet.reps : set.targetReps,
      rpe: null,
      isCompleted: true,
    };
  });
}

export function buildMockHistorySessionDetail(
  instance: ProgramInstanceRecord,
  item: MockHistoryItem,
): {
  prescription: PrescriptionData;
  setLogs: SetLogRecord[];
  result: WorkoutResultRecord;
} {
  const prescription = getMockPrescription(instance, item);

  return {
    prescription,
    setLogs: buildMockSetLogs(item, prescription),
    result: {
      sessionId: item.sessionId,
      instanceId: item.instanceId,
      completedAt: item.completedAt,
      summary: {
        totalVolume: item.totalVolume,
        amrapReps: item.lastWorkSet.reps,
        isPR: false,
      },
    },
  };
}

function getTrainingDayOffsets(): number[] {
  return DEFAULT_TRAINING_DAYS
    .map((day) => WEEKDAY_TO_OFFSET[day])
    .sort((a, b) => a - b);
}

function getMockWeekIndex(weekPosition: number, weeksPerCycle: number): number {
  const offset = weeksPerCycle === 4 ? 1 : 0;
  return (weekPosition + offset) % weeksPerCycle;
}

function getDefaultMockHistoryMonthCount(referenceDate: Date): number {
  const yearDelta = referenceDate.getFullYear() - MOCK_HISTORY_START_YEAR;
  const monthDelta = referenceDate.getMonth() - MOCK_HISTORY_START_MONTH_INDEX;

  return Math.max(yearDelta * 12 + monthDelta + 1, 1);
}

function getMockHistoryMonthStarts(referenceDate: Date, totalMonths: number): Date[] {
  const endMonthStart = getMonthStart(referenceDate);
  const oldestMonthStart = addMonths(endMonthStart, -(totalMonths - 1));

  return Array.from({ length: totalMonths }, (_, monthPosition) =>
    addMonths(oldestMonthStart, monthPosition),
  );
}

function getLatestCompleteTrainingWeekStart(referenceDate: Date, trainingDayOffsets: readonly number[]): Date {
  const currentWeekStart = getWeekStart(referenceDate);
  const lastTrainingDayOffset = Math.max(...trainingDayOffsets, 0);
  const lastTrainingDateInCurrentWeek = addDays(currentWeekStart, lastTrainingDayOffset);

  if (lastTrainingDateInCurrentWeek <= referenceDate) {
    return currentWeekStart;
  }

  return addDays(currentWeekStart, -7);
}

function getMockMonthWeekStart(
  monthStart: Date,
  referenceDate: Date,
  trainingDayOffsets: readonly number[],
): Date {
  if (isSameMonth(monthStart, referenceDate)) {
    return getLatestCompleteTrainingWeekStart(referenceDate, trainingDayOffsets);
  }

  return getWeekStart(new Date(monthStart.getFullYear(), monthStart.getMonth(), 15));
}

function getRecentMockWeekStarts(latestWeekStart: Date, totalWeeks: number): Date[] {
  const oldestWeekStart = addDays(latestWeekStart, -(totalWeeks - 1) * 7);

  return Array.from({ length: totalWeeks }, (_, weekPosition) =>
    addDays(oldestWeekStart, weekPosition * 7),
  );
}

export function buildMockHistoryItems(
  instance: ProgramInstanceRecord,
  totalMonths = getDefaultMockHistoryMonthCount(new Date()),
): MockHistoryItem[] {
  const weeksPerCycle = instance.params.includeDeload ? 4 : 3;
  const trainingDayOffsets = getTrainingDayOffsets();
  const referenceDate = new Date();
  const monthStarts = getMockHistoryMonthStarts(referenceDate, totalMonths);
  const latestCompleteWeekStart = getLatestCompleteTrainingWeekStart(referenceDate, trainingDayOffsets);
  const oldestRecentWeekStart = addDays(latestCompleteWeekStart, -(RECENT_MOCK_HISTORY_WEEKS - 1) * 7);
  const oldestRecentMonthStart = getMonthStart(oldestRecentWeekStart);
  const monthlyPeriods: MockHistoryPeriod[] = monthStarts
    .filter((monthStart) => monthStart < oldestRecentMonthStart)
    .map((monthStart) => ({
      key: `month-${formatMonthKey(monthStart)}`,
      weekStart: getMockMonthWeekStart(monthStart, referenceDate, trainingDayOffsets),
    }));
  const recentPeriods: MockHistoryPeriod[] = getRecentMockWeekStarts(
    latestCompleteWeekStart,
    RECENT_MOCK_HISTORY_WEEKS,
  ).map((weekStart) => ({
    key: `recent-${formatDateKey(weekStart)}`,
    weekStart,
  }));
  const periods = [...monthlyPeriods, ...recentPeriods]
    .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  const lastPeriodIndex = Math.max(periods.length - 1, 1);

  return periods.map((period, periodPosition) => {
    const progressRatio = periodPosition / lastPeriodIndex;
    const cycleIndex = -Math.ceil((periods.length - periodPosition) / weeksPerCycle);
    const weekIndex = getMockWeekIndex(periodPosition, weeksPerCycle);

    return instance.params.liftOrder.map((lift, dayIndex) => {
      const tm = instance.state.trainingMaxes[lift];
      const dayOffset = trainingDayOffsets[dayIndex] ?? dayIndex;
      const date = addDays(period.weekStart, dayOffset);
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
        sessionId: `mock-history-${period.key}-${dayIndex}-${lift}`,
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
        lastWorkSet: buildMockLastWorkSet(instance, {
          weekIndex,
          mainLiftKey: lift,
        }),
        isMock: true as const,
      } satisfies MockHistoryItem;
    });
  })
    .flat()
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}
