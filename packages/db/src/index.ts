// ─── Client ─────────────────────────────────────────────
export { DB_NAME, getDatabase, setDatabase } from "./client";

// ─── Migrator ───────────────────────────────────────────
export { CURRENT_SCHEMA_VERSION, runMigrations } from "./migrator";

// ─── Backup ─────────────────────────────────────────────
export {
    exportDataBackup, getDataBackupSummary, importDataBackup,
    parseDataBackupJson
} from "./backup";
export type { DataBackupSummary, OwnLiftDataBackup } from "./backup";

// ─── Helpers ────────────────────────────────────────────
export { insertMeta, softDeleteMeta, updateMeta } from "./helpers/sync-meta";

// ─── Repos ──────────────────────────────────────────────
export {
    getAllSettings, getSetting, setSetting
} from "./repos/settings-repo";

export {
    archiveInstance, createProgramInstance,
    getActiveInstance,
    updateInstanceParams,
    updateInstanceState
} from "./repos/program-instance-repo";
export type { ProgramInstanceRecord } from "./repos/program-instance-repo";

export {
    bulkCreateStubs, getNextIncompleteStub, getStubsByInstance, getStubsByWeek, reorderStubsByWeek, updateStubStatus
} from "./repos/session-stub-repo";
export type { SessionStubRecord } from "./repos/session-stub-repo";

export {
    createPrescription,
    getPrescriptionBySession,
    updatePrescription
} from "./repos/prescription-repo";
export type { PrescriptionRecord } from "./repos/prescription-repo";

export {
    clearSetLogsForSession, getSetLogsBySession, upsertSetLog
} from "./repos/set-log-repo";
export type { SetLogRecord } from "./repos/set-log-repo";

export {
    createWorkoutResult,
    getWorkoutResultBySession,
    getWorkoutResultsByInstance
} from "./repos/workout-result-repo";
export type { WorkoutResultRecord } from "./repos/workout-result-repo";

export {
    createExercise, getOrCreateExercise, getRecentExercises, searchExercises
} from "./repos/exercise-repo";
export type { ExerciseRecord } from "./repos/exercise-repo";
