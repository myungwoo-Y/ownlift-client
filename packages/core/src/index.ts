// ─── Math ───────────────────────────────────────────────
export { calcE1RM, calcWeight, roundWeight } from "./math";

// ─── Program (5/3/1 engine) ─────────────────────────────
export {
    CLASSIC_531_PROGRAM_ID,
    CLASSIC_531_VERSION,
    DAYS_PER_WEEK,
    DEFAULT_LIFT_ORDER,
    WARMUP_SETS, WEEKS_PER_CYCLE,
    WEEKS_PER_CYCLE_NO_DELOAD, WEEK_LABELS,
    WEEK_PERCENTAGES,
    WEEK_REPS, complete,
    getWeekLabel, initialize, isAmrapWeek, prescribe
} from "./program";

export type {
    CompleteResult, InitializeResult, SessionStubSeed
} from "./program";

