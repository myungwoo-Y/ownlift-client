export {
    CLASSIC_531_PROGRAM_ID,
    CLASSIC_531_VERSION,
    DAYS_PER_WEEK,
    DEFAULT_LIFT_ORDER,
    WARMUP_SETS, WEEKS_PER_CYCLE,
    WEEKS_PER_CYCLE_NO_DELOAD, WEEK_LABELS,
    WEEK_PERCENTAGES,
    WEEK_REPS, isAmrapWeek
} from "./constants";

export {
    complete,
    getWeekLabel, initialize,
    prescribe
} from "./classic531";

export type {
    CompleteResult, InitializeResult, SessionStubSeed
} from "./classic531";

