const migration001 = `
PRAGMA foreign_keys = ON;

-- =============
-- 0) settings
-- =============
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0
);

-- =============
-- 1) exercises
-- =============
CREATE TABLE IF NOT EXISTS exercises (
  id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  name TEXT NOT NULL,
  is_user_defined INTEGER NOT NULL DEFAULT 1,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name_active
  ON exercises(name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_dirty
  ON exercises(dirty)
  WHERE dirty = 1;

-- =============
-- 2) program_definitions
-- =============
CREATE TABLE IF NOT EXISTS program_definitions (
  program_id TEXT NOT NULL,
  version INTEGER NOT NULL,

  server_id TEXT NULL,

  definition_json TEXT NOT NULL,
  is_premium INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  PRIMARY KEY (program_id, version)
);

CREATE INDEX IF NOT EXISTS idx_program_defs_dirty
  ON program_definitions(dirty)
  WHERE dirty = 1;

-- =============
-- 3) program_instances
-- =============
CREATE TABLE IF NOT EXISTS program_instances (
  instance_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  program_id TEXT NOT NULL,
  program_version INTEGER NOT NULL,

  name TEXT NULL,
  status TEXT NOT NULL,
  start_date TEXT NOT NULL,

  params_json TEXT NOT NULL,
  state_json TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_program_instances_status_active
  ON program_instances(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_program_instances_dirty
  ON program_instances(dirty)
  WHERE dirty = 1;

-- =============
-- 4) session_stubs
-- =============
CREATE TABLE IF NOT EXISTS session_stubs (
  session_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  instance_id TEXT NOT NULL,
  scheduled_date TEXT NULL,
  cycle_index INTEGER NOT NULL,
  week_index INTEGER NOT NULL,
  day_index INTEGER NOT NULL,

  main_lift_key TEXT NOT NULL,
  status TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(instance_id) REFERENCES program_instances(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_session_stubs_instance_order
  ON session_stubs(instance_id, cycle_index, week_index, day_index);

CREATE INDEX IF NOT EXISTS idx_session_stubs_date
  ON session_stubs(scheduled_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_session_stubs_dirty
  ON session_stubs(dirty)
  WHERE dirty = 1;

-- =============
-- 5) prescriptions
-- =============
CREATE TABLE IF NOT EXISTS prescriptions (
  session_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  instance_id TEXT NOT NULL,

  prescription_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id),
  FOREIGN KEY(instance_id) REFERENCES program_instances(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_instance
  ON prescriptions(instance_id);

CREATE INDEX IF NOT EXISTS idx_prescriptions_dirty
  ON prescriptions(dirty)
  WHERE dirty = 1;

-- =============
-- 6) workout_results
-- =============
CREATE TABLE IF NOT EXISTS workout_results (
  session_id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  instance_id TEXT NOT NULL,

  completed_at TEXT NOT NULL,
  summary_json TEXT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id),
  FOREIGN KEY(instance_id) REFERENCES program_instances(instance_id)
);

CREATE INDEX IF NOT EXISTS idx_results_instance
  ON workout_results(instance_id);

CREATE INDEX IF NOT EXISTS idx_results_dirty
  ON workout_results(dirty)
  WHERE dirty = 1;

-- =============
-- 7) set_logs
-- =============
CREATE TABLE IF NOT EXISTS set_logs (
  id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,

  set_type TEXT NOT NULL,
  set_order INTEGER NOT NULL,

  planned_json TEXT NULL,
  actual_weight REAL NULL,
  actual_reps INTEGER NULL,
  rpe REAL NULL,

  is_completed INTEGER NOT NULL DEFAULT 0,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id),
  FOREIGN KEY(exercise_id) REFERENCES exercises(id)
);

CREATE INDEX IF NOT EXISTS idx_set_logs_session_order
  ON set_logs(session_id, set_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_set_logs_dirty
  ON set_logs(dirty)
  WHERE dirty = 1;

-- =============
-- 8) pr_events (optional cache)
-- =============
CREATE TABLE IF NOT EXISTS pr_events (
  id TEXT PRIMARY KEY,
  server_id TEXT NULL,

  exercise_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  value REAL NOT NULL,

  session_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  deleted_at TEXT NULL,
  dirty INTEGER NOT NULL DEFAULT 1,
  revision INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY(exercise_id) REFERENCES exercises(id),
  FOREIGN KEY(session_id) REFERENCES session_stubs(session_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_events_exercise_time
  ON pr_events(exercise_id, occurred_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_pr_events_dirty
  ON pr_events(dirty)
  WHERE dirty = 1;
`;

export default migration001;
