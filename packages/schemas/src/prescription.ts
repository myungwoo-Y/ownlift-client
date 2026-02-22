import { z } from "zod";
import { IdSchema, SyncMetaSchema } from "./common";

// ─── Single prescribed set ──────────────────────────────
export const PrescriptionSetSchema = z.object({
  setOrder: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  targetWeight: z.number().nonnegative(),
  targetReps: z.number().int().positive(),
  isAmrap: z.boolean().default(false),
  isWarmup: z.boolean().default(false),
});

export type PrescriptionSet = z.infer<typeof PrescriptionSetSchema>;

// ─── Full prescription (snapshot, immutable after creation) ─
export const PrescriptionDataSchema = z.object({
  mainLift: z.string(),
  trainingMax: z.number().positive(),
  sets: z.array(PrescriptionSetSchema),
});

export type PrescriptionData = z.infer<typeof PrescriptionDataSchema>;

// ─── Prescription row ───────────────────────────────────
export const PrescriptionSchema = z
  .object({
    sessionId: IdSchema,
    instanceId: IdSchema,
    prescriptionJson: PrescriptionDataSchema,
  })
  .merge(SyncMetaSchema);

export type Prescription = z.infer<typeof PrescriptionSchema>;
