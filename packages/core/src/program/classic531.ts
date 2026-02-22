import type {
    MainLift,
    PrescriptionData,
    PrescriptionSet,
    ProgramParams,
    ProgramState,
    TrainingMaxes,
} from "@ownlift/schemas";
import { calcWeight } from "../math/percentage";
import {
    CLASSIC_531_PROGRAM_ID,
    CLASSIC_531_VERSION,
    DAYS_PER_WEEK,
    isAmrapWeek,
    WARMUP_SETS,
    WEEK_LABELS,
    WEEK_PERCENTAGES,
    WEEK_REPS,
    WEEKS_PER_CYCLE,
    WEEKS_PER_CYCLE_NO_DELOAD,
} from "./constants";

// ─── Types ──────────────────────────────────────────────

/** Minimal stub info returned by initialize */
export interface SessionStubSeed {
  cycleIndex: number;
  weekIndex: number;
  dayIndex: number;
  mainLiftKey: MainLift;
}

export interface InitializeResult {
  programId: string;
  programVersion: number;
  state: ProgramState;
  stubs: SessionStubSeed[];
}

export interface CompleteResult {
  newState: ProgramState;
  /** True if a new cycle started (TMs increased) */
  cycleAdvanced: boolean;
}

// ─── Initialize ─────────────────────────────────────────

export function initialize({
  params,
}: {
  params: ProgramParams;
}): InitializeResult {
  const weeksCount = params.includeDeload
    ? WEEKS_PER_CYCLE
    : WEEKS_PER_CYCLE_NO_DELOAD;

  const stubs: SessionStubSeed[] = [];
  for (let w = 0; w < weeksCount; w++) {
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      stubs.push({
        cycleIndex: 0,
        weekIndex: w,
        dayIndex: d,
        mainLiftKey: params.liftOrder[d],
      });
    }
  }

  const state: ProgramState = {
    currentCycle: 0,
    currentWeek: 0,
    currentDay: 0,
    trainingMaxes: { ...params.trainingMaxes },
  };

  return {
    programId: CLASSIC_531_PROGRAM_ID,
    programVersion: CLASSIC_531_VERSION,
    state,
    stubs,
  };
}

// ─── Prescribe ──────────────────────────────────────────

export function prescribe({
  params,
  state,
  weekIndex,
  mainLift,
}: {
  params: ProgramParams;
  state: ProgramState;
  weekIndex: number;
  mainLift: MainLift;
}): PrescriptionData {
  const tm = state.trainingMaxes[mainLift];
  const percentages = WEEK_PERCENTAGES[weekIndex];
  const reps = WEEK_REPS[weekIndex];

  if (!percentages || !reps) {
    throw new Error(`Invalid weekIndex: ${String(weekIndex)}`);
  }

  const sets: PrescriptionSet[] = [];
  let order = 0;

  // Warm-up sets (optional)
  if (params.warmUpEnabled) {
    for (const warmup of WARMUP_SETS) {
      sets.push({
        setOrder: order++,
        percentage: warmup.percentage,
        targetWeight: calcWeight({
          tm,
          percentage: warmup.percentage,
          roundingIncrement: params.roundingIncrement,
          roundingMode: params.roundingMode,
        }),
        targetReps: warmup.reps,
        isAmrap: false,
        isWarmup: true,
      });
    }
  }

  // Work sets
  for (let i = 0; i < percentages.length; i++) {
    const pct = percentages[i];
    const rep = reps[i];
    const isLastWorkSet = i === percentages.length - 1;

    sets.push({
      setOrder: order++,
      percentage: pct,
      targetWeight: calcWeight({
        tm,
        percentage: pct,
        roundingIncrement: params.roundingIncrement,
        roundingMode: params.roundingMode,
      }),
      targetReps: rep,
      isAmrap: isLastWorkSet && isAmrapWeek(weekIndex),
      isWarmup: false,
    });
  }

  return {
    mainLift,
    trainingMax: tm,
    sets,
  };
}

// ─── Complete ───────────────────────────────────────────

/** Advance state after completing a session. */
export function complete({
  params,
  state,
}: {
  params: ProgramParams;
  state: ProgramState;
}): CompleteResult {
  const weeksCount = params.includeDeload
    ? WEEKS_PER_CYCLE
    : WEEKS_PER_CYCLE_NO_DELOAD;

  let nextDay = state.currentDay + 1;
  let nextWeek = state.currentWeek;
  let nextCycle = state.currentCycle;
  let cycleAdvanced = false;
  let tms = { ...state.trainingMaxes };

  if (nextDay >= DAYS_PER_WEEK) {
    nextDay = 0;
    nextWeek += 1;
  }

  if (nextWeek >= weeksCount) {
    nextWeek = 0;
    nextDay = 0;
    nextCycle += 1;
    cycleAdvanced = true;

    // TM increase at cycle boundary
    tms = advanceTrainingMaxes({ tms, params });
  }

  const newState: ProgramState = {
    currentCycle: nextCycle,
    currentWeek: nextWeek,
    currentDay: nextDay,
    trainingMaxes: tms,
  };

  return { newState, cycleAdvanced };
}

// ─── TM Advance (internal) ──────────────────────────────

const UPPER_LIFTS: readonly MainLift[] = ["bench", "press"];
const LOWER_LIFTS: readonly MainLift[] = ["squat", "deadlift"];

function advanceTrainingMaxes({
  tms,
  params,
}: {
  tms: TrainingMaxes;
  params: ProgramParams;
}): TrainingMaxes {
  const next = { ...tms };

  for (const lift of UPPER_LIFTS) {
    next[lift] += params.tmIncreaseUpper;
  }
  for (const lift of LOWER_LIFTS) {
    next[lift] += params.tmIncreaseLower;
  }

  return next;
}

// ─── Utility: get week label ────────────────────────────
export function getWeekLabel(weekIndex: number): string {
  return WEEK_LABELS[weekIndex] ?? `Week ${String(weekIndex + 1)}`;
}
