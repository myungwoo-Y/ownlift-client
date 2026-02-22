import type { MainLift } from "@ownlift/schemas";

// ─── Week percentages (% of TM) ────────────────────────
// Row = [set1%, set2%, set3%]
export const WEEK_PERCENTAGES: Record<number, readonly number[]> = {
  0: [65, 75, 85], // Week 1 — "5s"
  1: [70, 80, 90], // Week 2 — "3s"
  2: [75, 85, 95], // Week 3 — "5/3/1"
  3: [40, 50, 60], // Week 4 — Deload
} as const;

// ─── Target reps per set per week ───────────────────────
// Row = [set1 reps, set2 reps, set3 reps]
export const WEEK_REPS: Record<number, readonly number[]> = {
  0: [5, 5, 5],  // Week 1 — 5s
  1: [3, 3, 3],  // Week 2 — 3s (last set AMRAP)
  2: [5, 3, 1],  // Week 3 — 5/3/1 (last set AMRAP)
  3: [5, 5, 5],  // Week 4 — Deload (no AMRAP)
} as const;

// ─── Week labels ────────────────────────────────────────
export const WEEK_LABELS: Record<number, string> = {
  0: "5s",
  1: "3s",
  2: "5/3/1",
  3: "Deload",
} as const;

// ─── AMRAP: last work set of weeks 0, 1, 2 ─────────────
export function isAmrapWeek(weekIndex: number): boolean {
  return weekIndex >= 0 && weekIndex <= 2;
}

// ─── Default warm-up sets (% of TM) ────────────────────
export const WARMUP_SETS: readonly { percentage: number; reps: number }[] = [
  { percentage: 40, reps: 5 },
  { percentage: 50, reps: 5 },
  { percentage: 60, reps: 3 },
] as const;

// ─── Default lift order (Mon/Tue/Thu/Fri) ───────────────
export const DEFAULT_LIFT_ORDER: readonly MainLift[] = [
  "squat",
  "bench",
  "deadlift",
  "press",
] as const;

// ─── Number of weeks in a cycle ─────────────────────────
export const WEEKS_PER_CYCLE = 4;
export const WEEKS_PER_CYCLE_NO_DELOAD = 3;
export const DAYS_PER_WEEK = 4;

// ─── Program ID / version ───────────────────────────────
export const CLASSIC_531_PROGRAM_ID = "classic-531";
export const CLASSIC_531_VERSION = 1;
