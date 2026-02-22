import type { MainLift, SessionStatus } from "@ownlift/schemas";
import { getDatabase } from "../client";
import { insertMeta, updateMeta } from "../helpers/sync-meta";

interface SessionStubRow {
  session_id: string;
  instance_id: string;
  scheduled_date: string | null;
  cycle_index: number;
  week_index: number;
  day_index: number;
  main_lift_key: string;
  status: string;
  revision: number;
}

export interface SessionStubRecord {
  sessionId: string;
  instanceId: string;
  scheduledDate: string | null;
  cycleIndex: number;
  weekIndex: number;
  dayIndex: number;
  mainLiftKey: MainLift;
  status: SessionStatus;
}

function rowToRecord(row: SessionStubRow): SessionStubRecord {
  return {
    sessionId: row.session_id,
    instanceId: row.instance_id,
    scheduledDate: row.scheduled_date,
    cycleIndex: row.cycle_index,
    weekIndex: row.week_index,
    dayIndex: row.day_index,
    mainLiftKey: row.main_lift_key as MainLift,
    status: row.status as SessionStatus,
  };
}

/** Bulk create session stubs */
export async function bulkCreateStubs(
  stubs: Array<{
    sessionId: string;
    instanceId: string;
    scheduledDate: string | null;
    cycleIndex: number;
    weekIndex: number;
    dayIndex: number;
    mainLiftKey: MainLift;
  }>,
): Promise<void> {
  const db = getDatabase();
  const meta = insertMeta();

  for (const stub of stubs) {
    await db.runAsync(
      `INSERT INTO session_stubs
       (session_id, instance_id, scheduled_date, cycle_index, week_index, day_index,
        main_lift_key, status, created_at, updated_at, deleted_at, dirty, revision)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'planned', ?, ?, ?, ?, ?)`,
      stub.sessionId,
      stub.instanceId,
      stub.scheduledDate,
      stub.cycleIndex,
      stub.weekIndex,
      stub.dayIndex,
      stub.mainLiftKey,
      meta.created_at,
      meta.updated_at,
      meta.deleted_at,
      meta.dirty,
      meta.revision,
    );
  }
}

/** Get all session stubs for an instance, ordered by cycle/week/day */
export async function getStubsByInstance(instanceId: string): Promise<SessionStubRecord[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SessionStubRow>(
    `SELECT session_id, instance_id, scheduled_date, cycle_index, week_index,
            day_index, main_lift_key, status, revision
     FROM session_stubs
     WHERE instance_id = ? AND deleted_at IS NULL
     ORDER BY cycle_index, week_index, day_index`,
    instanceId,
  );

  return rows.map(rowToRecord);
}

/** Get the next incomplete session stub (first non-completed, non-skipped) */
export async function getNextIncompleteStub(instanceId: string): Promise<SessionStubRecord | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<SessionStubRow>(
    `SELECT session_id, instance_id, scheduled_date, cycle_index, week_index,
            day_index, main_lift_key, status, revision
     FROM session_stubs
     WHERE instance_id = ? AND status NOT IN ('completed', 'skipped') AND deleted_at IS NULL
     ORDER BY cycle_index, week_index, day_index
     LIMIT 1`,
    instanceId,
  );

  return row ? rowToRecord(row) : null;
}

/** Update session stub status */
export async function updateStubStatus({
  sessionId,
  status,
}: {
  sessionId: string;
  status: SessionStatus;
}): Promise<void> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ revision: number }>(
    "SELECT revision FROM session_stubs WHERE session_id = ?",
    sessionId,
  );
  if (!row) {
    throw new Error(`Session stub not found: ${sessionId}`);
  }

  const meta = updateMeta(row.revision);
  await db.runAsync(
    `UPDATE session_stubs
     SET status = ?, updated_at = ?, dirty = ?, revision = ?
     WHERE session_id = ?`,
    status,
    meta.updated_at,
    meta.dirty,
    meta.revision,
    sessionId,
  );
}

/** Get stubs for a specific week */
export async function getStubsByWeek({
  instanceId,
  cycleIndex,
  weekIndex,
}: {
  instanceId: string;
  cycleIndex: number;
  weekIndex: number;
}): Promise<SessionStubRecord[]> {
  const db = getDatabase();
  const rows = await db.getAllAsync<SessionStubRow>(
    `SELECT session_id, instance_id, scheduled_date, cycle_index, week_index,
            day_index, main_lift_key, status, revision
     FROM session_stubs
     WHERE instance_id = ? AND cycle_index = ? AND week_index = ? AND deleted_at IS NULL
     ORDER BY day_index`,
    instanceId,
    cycleIndex,
    weekIndex,
  );

  return rows.map(rowToRecord);
}
