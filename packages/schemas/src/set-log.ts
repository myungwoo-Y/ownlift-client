import { z } from "zod";
import { IdSchema, SyncMetaSchema } from "./common";

// ─── Set Type ───────────────────────────────────────────
export const SetTypeSchema = z.enum(["warmup", "work", "amrap", "assistance"]);
export type SetType = z.infer<typeof SetTypeSchema>;

// ─── Planned data (stored as JSON in set_logs.planned_json) ─
export const PlannedSetDataSchema = z
  .object({
    targetWeight: z.number().nonnegative(),
    targetReps: z.number().int().positive(),
    percentage: z.number().min(0).max(100).optional(),
  })
  .nullable();

export type PlannedSetData = z.infer<typeof PlannedSetDataSchema>;

// ─── Set Log (row-level) ────────────────────────────────
export const SetLogSchema = z
  .object({
    id: IdSchema,
    sessionId: IdSchema,
    exerciseId: IdSchema,
    setType: SetTypeSchema,
    setOrder: z.number().int().min(0),
    plannedJson: PlannedSetDataSchema.default(null),
    actualWeight: z.number().nullable().default(null),
    actualReps: z.number().int().nullable().default(null),
    rpe: z.number().nullable().default(null),
    isCompleted: z.boolean().default(false),
  })
  .merge(SyncMetaSchema);

export type SetLog = z.infer<typeof SetLogSchema>;
