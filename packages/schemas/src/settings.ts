import { z } from "zod";

// ─── Enums ──────────────────────────────────────────────
export const WeightUnitSchema = z.enum(["kg", "lb"]);
export type WeightUnit = z.infer<typeof WeightUnitSchema>;

export const RoundingModeSchema = z.enum(["nearest", "down", "up"]);
export type RoundingMode = z.infer<typeof RoundingModeSchema>;

// ─── Settings (key-value pairs stored in settings table) ─
export const SettingsKeySchema = z.enum([
  "unit",
  "roundingIncrement",
  "roundingMode",
  "tmIncreaseUpper",
  "tmIncreaseLower",
  "restTimerSeconds",
  "locale",
  "liftOrder",
  "warmUpEnabled",
  "includeDeload",
]);

export type SettingsKey = z.infer<typeof SettingsKeySchema>;

// ─── Rounding params (used by math helpers) ─────────────
export const RoundingParamsSchema = z.object({
  increment: z.number().positive(),
  mode: RoundingModeSchema,
});

export type RoundingParams = z.infer<typeof RoundingParamsSchema>;

// ─── TM Increase config ─────────────────────────────────
export const TmIncreaseSchema = z.object({
  upper: z.number().positive(),
  lower: z.number().positive(),
});

export type TmIncrease = z.infer<typeof TmIncreaseSchema>;

// ─── Default values ─────────────────────────────────────
export const DEFAULT_SETTINGS = {
  unit: "kg" as const,
  roundingIncrement: { kg: 2.5, lb: 5 },
  roundingMode: "nearest" as const,
  tmIncreaseUpper: { kg: 2.5, lb: 5 },
  tmIncreaseLower: { kg: 5, lb: 10 },
  restTimerSeconds: 180,
  warmUpEnabled: true,
  includeDeload: true,
} as const;
