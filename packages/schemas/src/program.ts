import { z } from "zod";
import { IdSchema, IsoDateTimeSchema, SyncMetaSchema } from "./common";

// ─── Enums ──────────────────────────────────────────────
export const MainLiftSchema = z.enum(["squat", "bench", "deadlift", "press"]);
export type MainLift = z.infer<typeof MainLiftSchema>;

export const ProgramStatusSchema = z.enum(["active", "paused", "archived"]);
export type ProgramStatus = z.infer<typeof ProgramStatusSchema>;

export const PROGRAM_WEEKDAY_OPTIONS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const ProgramWeekdaySchema = z.enum(PROGRAM_WEEKDAY_OPTIONS);
export type ProgramWeekday = z.infer<typeof ProgramWeekdaySchema>;

export const ProgramScheduleModeSchema = z.enum(["flexible", "scheduled"]);
export type ProgramScheduleMode = z.infer<typeof ProgramScheduleModeSchema>;

export const REQUIRED_SCHEDULED_DAYS = 4;
export const DEFAULT_SCHEDULED_DAYS = ["mon", "tue", "thu", "fri"] as const satisfies readonly ProgramWeekday[];

// ─── Training Max values ────────────────────────────────
export const TrainingMaxesSchema = z.object({
  squat: z.number().positive(),
  bench: z.number().positive(),
  deadlift: z.number().positive(),
  press: z.number().positive(),
});

export type TrainingMaxes = z.infer<typeof TrainingMaxesSchema>;

// ─── Program Params (stored as JSON in program_instances.params_json) ─
export const ProgramParamsSchema = z.object({
  trainingMaxes: TrainingMaxesSchema,
  unit: z.enum(["kg", "lb"]),
  roundingIncrement: z.number().positive(),
  roundingMode: z.enum(["nearest", "down", "up"]),
  tmIncreaseUpper: z.number().positive(),
  tmIncreaseLower: z.number().positive(),
  liftOrder: z.array(MainLiftSchema).length(4),
  warmUpEnabled: z.boolean(),
  includeDeload: z.boolean().default(true),
  scheduleMode: ProgramScheduleModeSchema.default("flexible"),
  scheduledDays: z.array(ProgramWeekdaySchema).default([...DEFAULT_SCHEDULED_DAYS]),
});

export type ProgramParams = z.infer<typeof ProgramParamsSchema>;

// ─── Program State (stored as JSON in program_instances.state_json) ──
export const ProgramStateSchema = z.object({
  currentCycle: z.number().int().min(0),
  currentWeek: z.number().int().min(0),
  currentDay: z.number().int().min(0),
  trainingMaxes: TrainingMaxesSchema,
});

export type ProgramState = z.infer<typeof ProgramStateSchema>;

// ─── Program Instance (row-level) ───────────────────────
export const ProgramInstanceSchema = z
  .object({
    instanceId: IdSchema,
    programId: z.string(),
    programVersion: z.number().int().min(1),
    name: z.string().nullable().default(null),
    status: ProgramStatusSchema,
    startDate: IsoDateTimeSchema,
    paramsJson: ProgramParamsSchema,
    stateJson: ProgramStateSchema,
  })
  .merge(SyncMetaSchema);

export type ProgramInstance = z.infer<typeof ProgramInstanceSchema>;
