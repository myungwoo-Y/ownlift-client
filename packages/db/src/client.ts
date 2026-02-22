import type { SQLiteDatabase } from "expo-sqlite";

const DB_NAME = "ownlift.db";

let _db: SQLiteDatabase | null = null;

/** Set the database instance (called during app bootstrap) */
export function setDatabase(db: SQLiteDatabase): void {
  _db = db;
}

/** Get the database instance (throws if not initialized) */
export function getDatabase(): SQLiteDatabase {
  if (!_db) {
    throw new Error("Database not initialized. Call setDatabase() first.");
  }
  return _db;
}

export { DB_NAME };

