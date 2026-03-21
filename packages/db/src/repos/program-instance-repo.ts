import {
  ProgramParamsSchema,
  ProgramStateSchema,
  type ProgramParams,
  type ProgramState,
} from "@ownlift/schemas";
import { getDatabase } from "../client";
import { insertMeta, updateMeta } from "../helpers/sync-meta";

interface ProgramInstanceRow {
  instance_id: string;
  program_id: string;
  program_version: number;
  name: string | null;
  status: string;
  start_date: string;
  params_json: string;
  state_json: string;
  revision: number;
}

export interface ProgramInstanceRecord {
  instanceId: string;
  programId: string;
  programVersion: number;
  name: string | null;
  status: string;
  startDate: string;
  params: ProgramParams;
  state: ProgramState;
}

function rowToRecord(row: ProgramInstanceRow): ProgramInstanceRecord {
  return {
    instanceId: row.instance_id,
    programId: row.program_id,
    programVersion: row.program_version,
    name: row.name,
    status: row.status,
    startDate: row.start_date,
    params: ProgramParamsSchema.parse(JSON.parse(row.params_json)),
    state: ProgramStateSchema.parse(JSON.parse(row.state_json)),
  };
}

/** Create a new program instance */
export async function createProgramInstance({
  instanceId,
  programId,
  programVersion,
  name,
  startDate,
  params,
  state,
}: {
  instanceId: string;
  programId: string;
  programVersion: number;
  name: string | null;
  startDate: string;
  params: ProgramParams;
  state: ProgramState;
}): Promise<void> {
  const db = getDatabase();
  const meta = insertMeta();

  await db.runAsync(
    `INSERT INTO program_instances
     (instance_id, program_id, program_version, name, status, start_date,
      params_json, state_json, created_at, updated_at, deleted_at, dirty, revision)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)`,
    instanceId,
    programId,
    programVersion,
    name,
    startDate,
    JSON.stringify(params),
    JSON.stringify(state),
    meta.created_at,
    meta.updated_at,
    meta.deleted_at,
    meta.dirty,
    meta.revision,
  );
}

/** Get the currently active program instance */
export async function getActiveInstance(): Promise<ProgramInstanceRecord | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<ProgramInstanceRow>(
    `SELECT instance_id, program_id, program_version, name, status,
            start_date, params_json, state_json, revision
     FROM program_instances
     WHERE status = 'active' AND deleted_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
  );

  return row ? rowToRecord(row) : null;
}

/** Update the state JSON of a program instance */
export async function updateInstanceState({
  instanceId,
  state,
}: {
  instanceId: string;
  state: ProgramState;
}): Promise<void> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ revision: number }>(
    "SELECT revision FROM program_instances WHERE instance_id = ?",
    instanceId,
  );
  if (!row) {
    throw new Error(`Instance not found: ${instanceId}`);
  }

  const meta = updateMeta(row.revision);
  await db.runAsync(
    `UPDATE program_instances
     SET state_json = ?, updated_at = ?, dirty = ?, revision = ?
     WHERE instance_id = ?`,
    JSON.stringify(state),
    meta.updated_at,
    meta.dirty,
    meta.revision,
    instanceId,
  );
}

/** Update the params JSON of a program instance */
export async function updateInstanceParams({
  instanceId,
  params,
}: {
  instanceId: string;
  params: ProgramParams;
}): Promise<void> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ revision: number }>(
    "SELECT revision FROM program_instances WHERE instance_id = ?",
    instanceId,
  );
  if (!row) {
    throw new Error(`Instance not found: ${instanceId}`);
  }

  const meta = updateMeta(row.revision);
  await db.runAsync(
    `UPDATE program_instances
     SET params_json = ?, updated_at = ?, dirty = ?, revision = ?
     WHERE instance_id = ?`,
    JSON.stringify(params),
    meta.updated_at,
    meta.dirty,
    meta.revision,
    instanceId,
  );
}

/** Archive (soft-complete) a program instance */
export async function archiveInstance(instanceId: string): Promise<void> {
  const db = getDatabase();
  const row = await db.getFirstAsync<{ revision: number }>(
    "SELECT revision FROM program_instances WHERE instance_id = ?",
    instanceId,
  );
  if (!row) {
    return;
  }

  const meta = updateMeta(row.revision);
  await db.runAsync(
    `UPDATE program_instances
     SET status = 'archived', updated_at = ?, dirty = ?, revision = ?
     WHERE instance_id = ?`,
    meta.updated_at,
    meta.dirty,
    meta.revision,
    instanceId,
  );
}
