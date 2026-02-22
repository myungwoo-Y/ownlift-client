import { nowISO } from "@ownlift/schemas";

/** Metadata columns for INSERT */
export function insertMeta() {
  const now = nowISO();
  return {
    created_at: now,
    updated_at: now,
    deleted_at: null,
    dirty: 1,
    revision: 0,
  };
}

/** Metadata columns for UPDATE (increment revision) */
export function updateMeta(currentRevision: number) {
  return {
    updated_at: nowISO(),
    dirty: 1,
    revision: currentRevision + 1,
  };
}

/** Metadata columns for SOFT DELETE */
export function softDeleteMeta(currentRevision: number) {
  const now = nowISO();
  return {
    updated_at: now,
    deleted_at: now,
    dirty: 1,
    revision: currentRevision + 1,
  };
}
