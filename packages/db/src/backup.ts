import { CURRENT_SCHEMA_VERSION } from "./migrator";
import { getDatabase } from "./client";

const BACKUP_KIND = "ownlift.data-backup";
const BACKUP_FORMAT_VERSION = 1;

type SQLiteValue = number | string | null;
type BackupRow = Record<string, SQLiteValue>;

const DATA_TABLES = [
  {
    name: "settings",
    columns: ["key", "value", "created_at", "updated_at", "deleted_at", "dirty", "revision"],
  },
  {
    name: "exercises",
    columns: ["id", "server_id", "name", "is_user_defined", "created_at", "updated_at", "deleted_at", "dirty", "revision"],
  },
  {
    name: "program_definitions",
    columns: [
      "program_id",
      "version",
      "server_id",
      "definition_json",
      "is_premium",
      "created_at",
      "updated_at",
      "deleted_at",
      "dirty",
      "revision",
    ],
  },
  {
    name: "program_instances",
    columns: [
      "instance_id",
      "server_id",
      "program_id",
      "program_version",
      "name",
      "status",
      "start_date",
      "params_json",
      "state_json",
      "created_at",
      "updated_at",
      "deleted_at",
      "dirty",
      "revision",
    ],
  },
  {
    name: "session_stubs",
    columns: [
      "session_id",
      "server_id",
      "instance_id",
      "scheduled_date",
      "cycle_index",
      "week_index",
      "day_index",
      "main_lift_key",
      "status",
      "created_at",
      "updated_at",
      "deleted_at",
      "dirty",
      "revision",
    ],
  },
  {
    name: "prescriptions",
    columns: [
      "session_id",
      "server_id",
      "instance_id",
      "prescription_json",
      "created_at",
      "updated_at",
      "deleted_at",
      "dirty",
      "revision",
    ],
  },
  {
    name: "workout_results",
    columns: [
      "session_id",
      "server_id",
      "instance_id",
      "completed_at",
      "summary_json",
      "created_at",
      "updated_at",
      "deleted_at",
      "dirty",
      "revision",
    ],
  },
  {
    name: "set_logs",
    columns: [
      "id",
      "server_id",
      "session_id",
      "exercise_id",
      "set_type",
      "set_order",
      "planned_json",
      "actual_weight",
      "actual_reps",
      "rpe",
      "is_completed",
      "created_at",
      "updated_at",
      "deleted_at",
      "dirty",
      "revision",
    ],
  },
  {
    name: "pr_events",
    columns: [
      "id",
      "server_id",
      "exercise_id",
      "kind",
      "value",
      "session_id",
      "occurred_at",
      "created_at",
      "updated_at",
      "deleted_at",
      "dirty",
      "revision",
    ],
  },
] as const;

type DataTable = (typeof DATA_TABLES)[number];
type DataTableName = DataTable["name"];
type DataBackupTables = Record<DataTableName, BackupRow[]>;

export interface OwnLiftDataBackup {
  kind: typeof BACKUP_KIND;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  schemaVersion: number;
  exportedAt: string;
  tables: DataBackupTables;
}

export interface DataBackupSummary {
  exportedAt: string;
  schemaVersion: number;
  tableCounts: Record<DataTableName, number>;
  totalRows: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSQLiteValue(value: unknown): value is SQLiteValue {
  return value === null || typeof value === "string" || typeof value === "number";
}

function normalizeRow(value: unknown, table: DataTable): BackupRow {
  if (!isRecord(value)) {
    throw new Error(`Invalid backup row in ${table.name}.`);
  }

  const allowedColumns = new Set<string>(table.columns);
  const row: BackupRow = {};

  for (const [key, cell] of Object.entries(value)) {
    if (!allowedColumns.has(key)) {
      throw new Error(`Unsupported column "${key}" in ${table.name}.`);
    }

    if (!isSQLiteValue(cell)) {
      throw new Error(`Unsupported value in ${table.name}.${key}.`);
    }

    row[key] = cell;
  }

  return row;
}

function validateSchemaVersion(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error("Backup schema version is invalid.");
  }

  if (value > CURRENT_SCHEMA_VERSION) {
    throw new Error("This backup was created by a newer OwnLift database schema.");
  }

  return value;
}

export function parseDataBackup(input: unknown): OwnLiftDataBackup {
  if (!isRecord(input)) {
    throw new Error("Backup file is not valid JSON data.");
  }

  if (input.kind !== BACKUP_KIND || input.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error("This is not a supported OwnLift backup file.");
  }

  if (typeof input.exportedAt !== "string" || Number.isNaN(Date.parse(input.exportedAt))) {
    throw new Error("Backup export date is invalid.");
  }

  if (!isRecord(input.tables)) {
    throw new Error("Backup tables are missing.");
  }

  const tables = {} as DataBackupTables;
  for (const table of DATA_TABLES) {
    const rows = input.tables[table.name];
    if (!Array.isArray(rows)) {
      throw new Error(`Backup table "${table.name}" is missing.`);
    }

    tables[table.name] = rows.map((row) => normalizeRow(row, table));
  }

  return {
    kind: BACKUP_KIND,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: validateSchemaVersion(input.schemaVersion),
    exportedAt: input.exportedAt,
    tables,
  };
}

export function parseDataBackupJson(contents: string): OwnLiftDataBackup {
  try {
    return parseDataBackup(JSON.parse(contents));
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Backup file could not be parsed.");
  }
}

export function getDataBackupSummary(backup: OwnLiftDataBackup): DataBackupSummary {
  const tableCounts = {} as Record<DataTableName, number>;
  let totalRows = 0;

  for (const table of DATA_TABLES) {
    const count = backup.tables[table.name].length;
    tableCounts[table.name] = count;
    totalRows += count;
  }

  return {
    exportedAt: backup.exportedAt,
    schemaVersion: backup.schemaVersion,
    tableCounts,
    totalRows,
  };
}

export async function exportDataBackup(): Promise<OwnLiftDataBackup> {
  const db = getDatabase();
  const schemaRow = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1",
  );
  const tables = {} as DataBackupTables;

  for (const table of DATA_TABLES) {
    const rows = await db.getAllAsync<BackupRow>(
      `SELECT ${table.columns.join(", ")} FROM ${table.name}`,
    );
    tables[table.name] = rows;
  }

  return {
    kind: BACKUP_KIND,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: schemaRow?.version ?? CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

async function insertRows(table: DataTable, rows: BackupRow[]): Promise<void> {
  const db = getDatabase();
  const placeholders = table.columns.map(() => "?").join(", ");
  const sql = `INSERT INTO ${table.name} (${table.columns.join(", ")}) VALUES (${placeholders})`;

  for (const row of rows) {
    await db.runAsync(
      sql,
      table.columns.map((column) => row[column] ?? null),
    );
  }
}

export async function importDataBackup(input: OwnLiftDataBackup): Promise<DataBackupSummary> {
  const backup = parseDataBackup(input);
  const db = getDatabase();
  let transactionStarted = false;

  await db.execAsync("PRAGMA foreign_keys = OFF");

  try {
    await db.execAsync("BEGIN IMMEDIATE TRANSACTION");
    transactionStarted = true;

    for (const table of [...DATA_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${table.name}`);
    }

    for (const table of DATA_TABLES) {
      await insertRows(table, backup.tables[table.name]);
    }

    await db.runAsync("DELETE FROM schema_version");
    await db.runAsync(
      "INSERT INTO schema_version (version) VALUES (?)",
      CURRENT_SCHEMA_VERSION,
    );

    const violations = await db.getAllAsync("PRAGMA foreign_key_check");
    if (violations.length > 0) {
      throw new Error("Backup data has invalid references.");
    }

    await db.execAsync("COMMIT");
    transactionStarted = false;
  } catch (error) {
    if (transactionStarted) {
      try {
        await db.execAsync("ROLLBACK");
      } catch {
        // Keep the original import error.
      }
    }

    throw error;
  } finally {
    await db.execAsync("PRAGMA foreign_keys = ON");
  }

  return getDataBackupSummary(backup);
}
