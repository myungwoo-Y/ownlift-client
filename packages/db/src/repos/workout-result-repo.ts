import type { WorkoutSummary } from "@ownlift/schemas";
import { getDatabase } from "../client";
import { insertMeta } from "../helpers/sync-meta";

interface WorkoutResultRow {
  session_id: string;
  instance_id: string;
  completed_at: string;
  summary_json: string | null;
}

export interface WorkoutResultRecord {
  sessionId: string;
  instanceId: string;
  completedAt: string;
  summary: WorkoutSummary;
}

function rowToRecord(row: WorkoutResultRow): WorkoutResultRecord {
  return {
    sessionId: row.session_id,
    instanceId: row.instance_id,
    completedAt: row.completed_at,
    summary: row.summary_json
      ? (JSON.parse(row.summary_json) as WorkoutSummary)
      : null,
  };
}

/** Create a workout result */
export async function createWorkoutResult({
  sessionId,
  instanceId,
  completedAt,
  summary,
}: {
  sessionId: string;
  instanceId: string;
  completedAt: string;
  summary: WorkoutSummary;
}): Promise<void> {
  const db = getDatabase();
  const meta = insertMeta();

  await db.runAsync(
    `INSERT INTO workout_results
     (session_id, instance_id, completed_at, summary_json,
      created_at, updated_at, deleted_at, dirty, revision)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sessionId,
    instanceId,
    completedAt,
    summary ? JSON.stringify(summary) : null,
    meta.created_at,
    meta.updated_at,
    meta.deleted_at,
    meta.dirty,
    meta.revision,
  );
}

/** Get workout result by session */
export async function getWorkoutResultBySession(
  sessionId: string,
): Promise<WorkoutResultRecord | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<WorkoutResultRow>(
    `SELECT session_id, instance_id, completed_at, summary_json
     FROM workout_results
     WHERE session_id = ? AND deleted_at IS NULL`,
    sessionId,
  );

  return row ? rowToRecord(row) : null;
}

/** Get all workout results for a program instance */
export async function getWorkoutResultsByInstance(
  instanceId: string,
): Promise<WorkoutResultRecord[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<WorkoutResultRow>(
    `SELECT session_id, instance_id, completed_at, summary_json
     FROM workout_results
     WHERE instance_id = ? AND deleted_at IS NULL
     ORDER BY completed_at DESC`,
    instanceId,
  );

  return rows.map(rowToRecord);
}
