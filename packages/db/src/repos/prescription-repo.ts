import type { PrescriptionData } from "@ownlift/schemas";
import { getDatabase } from "../client";
import { insertMeta } from "../helpers/sync-meta";

interface PrescriptionRow {
  session_id: string;
  instance_id: string;
  prescription_json: string;
}

export interface PrescriptionRecord {
  sessionId: string;
  instanceId: string;
  data: PrescriptionData;
}

function rowToRecord(row: PrescriptionRow): PrescriptionRecord {
  return {
    sessionId: row.session_id,
    instanceId: row.instance_id,
    data: JSON.parse(row.prescription_json) as PrescriptionData,
  };
}

/**
 * Create a prescription (snapshot — should never be updated after creation).
 */
export async function createPrescription({
  sessionId,
  instanceId,
  data,
}: {
  sessionId: string;
  instanceId: string;
  data: PrescriptionData;
}): Promise<void> {
  const db = getDatabase();
  const meta = insertMeta();

  await db.runAsync(
    `INSERT INTO prescriptions
     (session_id, instance_id, prescription_json,
      created_at, updated_at, deleted_at, dirty, revision)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    sessionId,
    instanceId,
    JSON.stringify(data),
    meta.created_at,
    meta.updated_at,
    meta.deleted_at,
    meta.dirty,
    meta.revision,
  );
}

/** Get the prescription for a session */
export async function getPrescriptionBySession(
  sessionId: string,
): Promise<PrescriptionRecord | null> {
  const db = getDatabase();
  const row = await db.getFirstAsync<PrescriptionRow>(
    `SELECT session_id, instance_id, prescription_json
     FROM prescriptions
     WHERE session_id = ? AND deleted_at IS NULL`,
    sessionId,
  );

  return row ? rowToRecord(row) : null;
}
