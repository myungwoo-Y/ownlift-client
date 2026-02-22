import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, SyncMetaSchema } from "./common";

// ─── Summary data (stored as JSON in workout_results.summary_json) ─
export const WorkoutSummarySchema = z
  .object({
    totalVolume: z.number().nonnegative().optional(),
    durationMinutes: z.number().nonnegative().optional(),
    amrapReps: z.number().int().nonnegative().optional(),
    isPR: z.boolean().optional(),
  })
  .nullable();

export type WorkoutSummary = z.infer<typeof WorkoutSummarySchema>;

// ─── Workout Result (row-level) ─────────────────────────
export const WorkoutResultSchema = z
  .object({
    sessionId: IdSchema,
    instanceId: IdSchema,
    completedAt: IsoDateTimeSchema,
    summaryJson: WorkoutSummarySchema.default(null),
  })
  .merge(SyncMetaSchema);

export type WorkoutResult = z.infer<typeof WorkoutResultSchema>;
