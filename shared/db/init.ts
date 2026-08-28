import type { DBDriver } from '../env'
import { DB_INDEX_NAMES, DB_TABLE_NAMES, DB_TRIGGER_NAMES } from './constants'

// `optional` statements are allowed to fail without aborting initialization
// (e.g. CREATE EXTENSION requires privileges the connected role may not have).
// `warning` explains the degradation to the operator; identical warnings are logged once.
export type DBInitStatement =
  | string
  | { sql: string; optional: true; warning: string }

const PG_TRGM_WARNING = [
  'the pg_trgm extension is not available, so task name search is not indexed',
  'and falls back to a sequential scan (results stay correct).',
  'To enable the index: install the postgresql-contrib package and let the',
  'role in TASKIQ_ADMIN_DB_URL run "CREATE EXTENSION pg_trgm" (database owner',
  'or superuser), or create the extension once by hand.'
].join(' ')

export const dbInitializationStatements: Record<DBDriver, DBInitStatement[]> = {
  sqlite: [
    'PRAGMA journal_mode = WAL',
    'PRAGMA synchronous = NORMAL',
    'PRAGMA journal_size_limit = 6144000',
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.settings}\` (\`key\` text PRIMARY KEY NOT NULL, \`value\` text)`,
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.tasks}\` (\`id\` text PRIMARY KEY NOT NULL, \`name\` text NOT NULL, \`state\` text NOT NULL, \`error\` text, \`worker\` text, \`execution_time\` real, \`queued_at\` integer NOT NULL, \`started_at\` integer, \`finished_at\` integer, \`args\` text, \`kwargs\` text, \`return_value\` text)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksQueuedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`queued_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksStartedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`started_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksFinishedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`finished_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksExecutionTime}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`execution_time\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksWorker}\` ON \`${DB_TABLE_NAMES.tasks}\` (worker COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksStateQueuedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`state\`, \`queued_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksStateStartedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`state\`, \`started_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksStateExecutionTime}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`state\`, \`execution_time\`)`,
    // FTS5 external-content table over name with trigram tokenizer (substring match, preserves LIKE %x% semantics)
    `CREATE VIRTUAL TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.tasksFts}\` USING fts5(name, content='${DB_TABLE_NAMES.tasks}', content_rowid='rowid', tokenize='trigram')`,
    `CREATE TRIGGER IF NOT EXISTS \`${DB_TRIGGER_NAMES.tasksFtsInsert}\` AFTER INSERT ON \`${DB_TABLE_NAMES.tasks}\` BEGIN INSERT INTO \`${DB_TABLE_NAMES.tasksFts}\`(rowid, name) VALUES (new.rowid, new.name); END`,
    `CREATE TRIGGER IF NOT EXISTS \`${DB_TRIGGER_NAMES.tasksFtsDelete}\` AFTER DELETE ON \`${DB_TABLE_NAMES.tasks}\` BEGIN INSERT INTO \`${DB_TABLE_NAMES.tasksFts}\`(\`${DB_TABLE_NAMES.tasksFts}\`, rowid, name) VALUES('delete', old.rowid, old.name); END`,
    `CREATE TRIGGER IF NOT EXISTS \`${DB_TRIGGER_NAMES.tasksFtsUpdate}\` AFTER UPDATE ON \`${DB_TABLE_NAMES.tasks}\` BEGIN INSERT INTO \`${DB_TABLE_NAMES.tasksFts}\`(\`${DB_TABLE_NAMES.tasksFts}\`, rowid, name) VALUES('delete', old.rowid, old.name); INSERT INTO \`${DB_TABLE_NAMES.tasksFts}\`(rowid, name) VALUES (new.rowid, new.name); END`,
    // rebuild FTS index from existing rows (no-op when table empty; cheap on subsequent runs only if needed)
    `INSERT INTO \`${DB_TABLE_NAMES.tasksFts}\`(\`${DB_TABLE_NAMES.tasksFts}\`) VALUES('rebuild')`
  ],
  postgres: [
    `CREATE TABLE IF NOT EXISTS "${DB_TABLE_NAMES.settings}" ("key" text PRIMARY KEY, "value" text)`,
    `CREATE TABLE IF NOT EXISTS "${DB_TABLE_NAMES.tasks}" ("id" text PRIMARY KEY, "name" text NOT NULL, "state" text NOT NULL, "error" text, "worker" text, "execution_time" real, "queued_at" timestamp with time zone NOT NULL, "started_at" timestamp with time zone, "finished_at" timestamp with time zone, "args" jsonb, "kwargs" jsonb, "return_value" jsonb)`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksQueuedAt}" ON "${DB_TABLE_NAMES.tasks}" ("queued_at")`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksStartedAt}" ON "${DB_TABLE_NAMES.tasks}" ("started_at")`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksFinishedAt}" ON "${DB_TABLE_NAMES.tasks}" ("finished_at")`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksExecutionTime}" ON "${DB_TABLE_NAMES.tasks}" ("execution_time")`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksWorker}" ON "${DB_TABLE_NAMES.tasks}" ("worker")`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksStateQueuedAt}" ON "${DB_TABLE_NAMES.tasks}" ("state", "queued_at")`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksStateStartedAt}" ON "${DB_TABLE_NAMES.tasks}" ("state", "started_at")`,
    `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksStateExecutionTime}" ON "${DB_TABLE_NAMES.tasks}" ("state", "execution_time")`,
    // both statements are optional: without pg_trgm the LIKE search still returns
    // correct results, it just falls back to a sequential scan.
    {
      sql: 'CREATE EXTENSION IF NOT EXISTS pg_trgm',
      optional: true,
      warning: PG_TRGM_WARNING
    },
    {
      sql: `CREATE INDEX IF NOT EXISTS "${DB_INDEX_NAMES.tasksNameTrgm}" ON "${DB_TABLE_NAMES.tasks}" USING gin (lower("name") gin_trgm_ops)`,
      optional: true,
      warning: PG_TRGM_WARNING
    }
  ]
}
