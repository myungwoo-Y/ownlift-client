import { z } from "zod";
import { IdSchema, SyncMetaSchema } from "./common";

// ─── Exercise (row-level) ───────────────────────────────
export const ExerciseSchema = z
  .object({
    id: IdSchema,
    name: z.string().min(1),
    isUserDefined: z.boolean().default(true),
  })
  .merge(SyncMetaSchema);

export type Exercise = z.infer<typeof ExerciseSchema>;
