import { getDatabase } from "../client";
import { insertMeta } from "../helpers/sync-meta";

interface ExerciseRow {
  id: string;
  name: string;
  is_user_defined: number;
}

export interface ExerciseRecord {
  id: string;
  name: string;
  isUserDefined: boolean;
}

function rowToRecord(row: ExerciseRow): ExerciseRecord {
  return {
    id: row.id,
    name: row.name,
    isUserDefined: row.is_user_defined === 1,
  };
}

/** Create an exercise */
export async function createExercise({
  id,
  name,
  isUserDefined,
}: {
  id: string;
  name: string;
  isUserDefined: boolean;
}): Promise<void> {
  const db = getDatabase();
  const meta = insertMeta();

  await db.runAsync(
    `INSERT INTO exercises
     (id, name, is_user_defined, created_at, updated_at, deleted_at, dirty, revision)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    name,
    isUserDefined ? 1 : 0,
    meta.created_at,
    meta.updated_at,
    meta.deleted_at,
    meta.dirty,
    meta.revision,
  );
}

/** Search exercises by name (partial match) */
export async function searchExercises(query: string): Promise<ExerciseRecord[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT id, name, is_user_defined
     FROM exercises
     WHERE name LIKE ? AND deleted_at IS NULL
     ORDER BY name
     LIMIT 20`,
    `%${query}%`,
  );

  return rows.map(rowToRecord);
}

/** Get recently used exercises (by set_logs join) */
export async function getRecentExercises(limit = 10): Promise<ExerciseRecord[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<ExerciseRow>(
    `SELECT DISTINCT e.id, e.name, e.is_user_defined
     FROM exercises e
     JOIN set_logs sl ON sl.exercise_id = e.id AND sl.deleted_at IS NULL
     WHERE e.deleted_at IS NULL
     ORDER BY sl.created_at DESC
     LIMIT ?`,
    limit,
  );

  return rows.map(rowToRecord);
}

/** Get or create an exercise by name */
export async function getOrCreateExercise({
  id,
  name,
}: {
  id: string;
  name: string;
}): Promise<ExerciseRecord> {
  const db = getDatabase();
  const existing = await db.getFirstAsync<ExerciseRow>(
    "SELECT id, name, is_user_defined FROM exercises WHERE name = ? AND deleted_at IS NULL",
    name,
  );

  if (existing) {
    return rowToRecord(existing);
  }

  await createExercise({ id, name, isUserDefined: true });
  return { id, name, isUserDefined: true };
}
