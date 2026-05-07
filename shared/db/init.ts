import type { DBDriver } from '../env'
import { DB_INDEX_NAMES, DB_TABLE_NAMES } from './constants'

export const dbInitializationStatements: Record<DBDriver, string[]> = {
  sqlite: [
    'PRAGMA journal_mode = WAL',
    'PRAGMA synchronous = NORMAL',
    'PRAGMA journal_size_limit = 6144000',
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.settings}\` (\`key\` text PRIMARY KEY NOT NULL, \`value\` text)`,
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.tasks}\` (\`id\` text PRIMARY KEY NOT NULL, \`name\` text NOT NULL, \`state\` text NOT NULL, \`error\` text, \`worker\` text, \`execution_time\` real, \`queued_at\` integer NOT NULL, \`started_at\` integer, \`finished_at\` integer, \`args\` text, \`kwargs\` text, \`return_value\` text)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksState}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`state\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksQueuedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`queued_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksStartedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`started_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksFinishedAt}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`finished_at\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksExecutionTime}\` ON \`${DB_TABLE_NAMES.tasks}\` (\`execution_time\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksName}\` ON \`${DB_TABLE_NAMES.tasks}\` (name COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksWorker}\` ON \`${DB_TABLE_NAMES.tasks}\` (worker COLLATE NOCASE)`
  ],
  postgres: [
    `CREATE TABLE IF NOT EXISTS \"${DB_TABLE_NAMES.settings}\" (\"key\" text PRIMARY KEY, \"value\" text)`,
    `CREATE TABLE IF NOT EXISTS \"${DB_TABLE_NAMES.tasks}\" (\"id\" text PRIMARY KEY, \"name\" text NOT NULL, \"state\" text NOT NULL, \"error\" text, \"worker\" text, \"execution_time\" real, \"queued_at\" timestamp with time zone NOT NULL, \"started_at\" timestamp with time zone, \"finished_at\" timestamp with time zone, \"args\" jsonb, \"kwargs\" jsonb, \"return_value\" jsonb)`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksState}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"state\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksQueuedAt}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"queued_at\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksStartedAt}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"started_at\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksFinishedAt}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"finished_at\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksExecutionTime}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"execution_time\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksName}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"name\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksWorker}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"worker\")`
  ]
}
