import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, SyncMetaSchema } from "./common";

// ─── PR Kind ────────────────────────────────────────────
export const PrKindSchema = z.enum(["topSetReps", "e1rm", "totalVolume"]);
export type PrKind = z.infer<typeof PrKindSchema>;

// ─── PR Event (row-level) ───────────────────────────────
export const PrEventSchema = z
  .object({
    id: IdSchema,
    exerciseId: IdSchema,
    kind: PrKindSchema,
    value: z.number(),
    sessionId: IdSchema,
    occurredAt: IsoDateTimeSchema,
  })
  .merge(SyncMetaSchema);

export type PrEvent = z.infer<typeof PrEventSchema>;
