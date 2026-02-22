import { getDatabase } from "../client";
import { insertMeta, updateMeta } from "../helpers/sync-meta";

/** Get a single setting value by key */
export async function getSetting(key: string): Promise<string | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ? AND deleted_at IS NULL",
    key,
  );
  return row?.value ?? null;
}

/** Get all non-deleted settings as a Record */
export async function getAllSettings(): Promise<Record<string, string>> {
  const db = getDatabase();
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE deleted_at IS NULL",
  );

  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

/** Set a setting value (upsert) */
export async function setSetting({
  key,
  value,
}: {
  key: string;
  value: string;
}): Promise<void> {
  const db = getDatabase();
  const existing = await db.getFirstAsync<{ key: string; revision: number }>(
    "SELECT key, revision FROM settings WHERE key = ?",
    key,
  );

  if (existing) {
    const meta = updateMeta(existing.revision);
    await db.runAsync(
      `UPDATE settings SET value = ?, updated_at = ?, dirty = ?, revision = ? WHERE key = ?`,
      value,
      meta.updated_at,
      meta.dirty,
      meta.revision,
      key,
    );
  } else {
    const meta = insertMeta();
    await db.runAsync(
      `INSERT INTO settings (key, value, created_at, updated_at, deleted_at, dirty, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      key,
      value,
      meta.created_at,
      meta.updated_at,
      meta.deleted_at,
      meta.dirty,
      meta.revision,
    );
  }
}
