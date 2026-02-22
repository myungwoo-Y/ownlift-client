import type { SQLiteDatabase } from "expo-sqlite";

import migration001 from "./migrations/001_init.sql";

const MIGRATIONS: readonly { version: number; sql: string }[] = [
  { version: 1, sql: migration001 },
];

/**
 * Run all pending migrations on the given database.
 *
 * Creates a `schema_version` table if it doesn't exist, then applies
 * each migration whose version exceeds the current version.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1",
  );
  let currentVersion = row?.version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      await db.execAsync(migration.sql);
      currentVersion = migration.version;
    }
  }

  // Upsert the version
  if (row) {
    await db.runAsync(
      "UPDATE schema_version SET version = ?",
      currentVersion,
    );
  } else {
    await db.runAsync(
      "INSERT INTO schema_version (version) VALUES (?)",
      currentVersion,
    );
  }
}
