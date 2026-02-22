import { z } from "zod";

// ─── Branded ID ─────────────────────────────────────────
export const IdSchema = z.string().uuid();
export type Id = z.infer<typeof IdSchema>;

// ─── ISO 8601 date-time string ──────────────────────────
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export type IsoDateTime = z.infer<typeof IsoDateTimeSchema>;

// ─── Sync-ready metadata (every synced table has these) ─
export const SyncMetaSchema = z.object({
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  deletedAt: IsoDateTimeSchema.nullable().default(null),
  dirty: z.number().int().min(0).max(1).default(1),
  revision: z.number().int().min(0).default(0),
  serverId: z.string().nullable().default(null),
});

export type SyncMeta = z.infer<typeof SyncMetaSchema>;

// ─── Helper: current ISO timestamp ──────────────────────
export function nowISO(): string {
  return new Date().toISOString();
}
