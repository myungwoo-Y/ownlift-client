import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, SyncMetaSchema } from "./common";
import { MainLiftSchema } from "./program";

// ─── Enums ──────────────────────────────────────────────
export const SessionStatusSchema = z.enum([
  "planned",
  "started",
  "completed",
  "skipped",
]);

export type SessionStatus = z.infer<typeof SessionStatusSchema>;

// ─── Session Stub (row-level) ───────────────────────────
export const SessionStubSchema = z
  .object({
    sessionId: IdSchema,
    instanceId: IdSchema,
    scheduledDate: IsoDateTimeSchema.nullable().default(null),
    cycleIndex: z.number().int().min(0),
    weekIndex: z.number().int().min(0),
    dayIndex: z.number().int().min(0),
    mainLiftKey: MainLiftSchema,
    status: SessionStatusSchema,
  })
  .merge(SyncMetaSchema);

export type SessionStub = z.infer<typeof SessionStubSchema>;
