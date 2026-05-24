import type { PlannedSetData, SetType } from "@ownlift/schemas";
import { getDatabase } from "../client";
import { insertMeta, updateMeta } from "../helpers/sync-meta";

interface SetLogRow {
  id: string;
  session_id: string;
  exercise_id: string;
  set_type: string;
  set_order: number;
  planned_json: string | null;
  actual_weight: number | null;
  actual_reps: number | null;
  rpe: number | null;
  is_completed: number;
  revision: number;
}

export interface SetLogRecord {
  id: string;
  sessionId: string;
  exerciseId: string;
  setType: SetType;
  setOrder: number;
  planned: PlannedSetData;
  actualWeight: number | null;
  actualReps: number | null;
  rpe: number | null;
  isCompleted: boolean;
}

function rowToRecord(row: SetLogRow): SetLogRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    setType: row.set_type as SetType,
    setOrder: row.set_order,
    planned: row.planned_json
      ? (JSON.parse(row.planned_json) as PlannedSetData)
      : null,
    actualWeight: row.actual_weight,
    actualReps: row.actual_reps,
    rpe: row.rpe,
    isCompleted: row.is_completed === 1,
  };
}

/** Upsert a set log (insert or update) */
export async function upsertSetLog({
  id,
  sessionId,
  exerciseId,
  setType,
  setOrder,
  planned,
  actualWeight,
  actualReps,
  rpe,
  isCompleted,
}: {
  id: string;
  sessionId: string;
  exerciseId: string;
  setType: SetType;
  setOrder: number;
  planned: PlannedSetData;
  actualWeight: number | null;
  actualReps: number | null;
  rpe: number | null;
  isCompleted: boolean;
}): Promise<void> {
  const db = getDatabase();

  const existing = await db.getFirstAsync<{ id: string; revision: number }>(
    "SELECT id, revision FROM set_logs WHERE id = ?",
    id,
  );

  const plannedStr = planned ? JSON.stringify(planned) : null;
  const completedInt = isCompleted ? 1 : 0;

  if (existing) {
    const meta = updateMeta(existing.revision);
    await db.runAsync(
      `UPDATE set_logs
       SET actual_weight = ?, actual_reps = ?, rpe = ?, is_completed = ?,
           updated_at = ?, dirty = ?, revision = ?
       WHERE id = ?`,
      actualWeight,
      actualReps,
      rpe,
      completedInt,
      meta.updated_at,
      meta.dirty,
      meta.revision,
      id,
    );
  } else {
    const meta = insertMeta();
    await db.runAsync(
      `INSERT INTO set_logs
       (id, session_id, exercise_id, set_type, set_order,
        planned_json, actual_weight, actual_reps, rpe, is_completed,
        created_at, updated_at, deleted_at, dirty, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      sessionId,
      exerciseId,
      setType,
      setOrder,
      plannedStr,
      actualWeight,
      actualReps,
      rpe,
      completedInt,
      meta.created_at,
      meta.updated_at,
      meta.deleted_at,
      meta.dirty,
      meta.revision,
    );
  }
}

/** Get all set logs for a session, ordered by set_order */
export async function getSetLogsBySession(sessionId: string): Promise<SetLogRecord[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SetLogRow>(
    `SELECT id, session_id, exercise_id, set_type, set_order,
            planned_json, actual_weight, actual_reps, rpe, is_completed, revision
     FROM set_logs
     WHERE session_id = ? AND deleted_at IS NULL
     ORDER BY set_order`,
    sessionId,
  );

  return rows.map(rowToRecord);
}

/** Clear (soft-delete) all set logs for a session */
export async function clearSetLogsForSession(sessionId: string): Promise<void> {
  const db = getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE set_logs
     SET deleted_at = ?, dirty = 1, revision = revision + 1
     WHERE session_id = ? AND deleted_at IS NULL`,
    now,
    sessionId,
  );
}
