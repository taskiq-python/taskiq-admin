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
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.tasksWorker}\` ON \`${DB_TABLE_NAMES.tasks}\` (worker COLLATE NOCASE)`,
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.schedules}\` (\`id\` text PRIMARY KEY NOT NULL, \`source_name\` text NOT NULL, \`task_name\` text NOT NULL, \`cron\` text, \`cron_offset\` text, \`time\` integer, \`interval\` text, \`args\` text, \`kwargs\` text, \`labels\` text, \`editable\` integer NOT NULL, \`opaque\` integer NOT NULL, \`status\` text NOT NULL, \`first_seen_at\` integer NOT NULL, \`last_seen_at\` integer NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.schedulesSourceName}\` ON \`${DB_TABLE_NAMES.schedules}\` (\`source_name\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.schedulesStatus}\` ON \`${DB_TABLE_NAMES.schedules}\` (\`status\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.schedulesTaskName}\` ON \`${DB_TABLE_NAMES.schedules}\` (task_name COLLATE NOCASE)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.schedulesLastSeenAt}\` ON \`${DB_TABLE_NAMES.schedules}\` (\`last_seen_at\`)`,
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.scheduleCommands}\` (\`id\` text PRIMARY KEY NOT NULL, \`schedule_id\` text, \`source_name\` text NOT NULL, \`type\` text NOT NULL, \`payload\` text NOT NULL, \`status\` text NOT NULL, \`error\` text, \`created_at\` integer NOT NULL, \`leased_at\` integer, \`resolved_at\` integer)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.scheduleCommandsSourceName}\` ON \`${DB_TABLE_NAMES.scheduleCommands}\` (\`source_name\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.scheduleCommandsStatus}\` ON \`${DB_TABLE_NAMES.scheduleCommands}\` (\`status\`)`,
    `CREATE INDEX IF NOT EXISTS \`${DB_INDEX_NAMES.scheduleCommandsCreatedAt}\` ON \`${DB_TABLE_NAMES.scheduleCommands}\` (\`created_at\`)`,
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.scheduleSources}\` (\`name\` text PRIMARY KEY NOT NULL, \`editable\` integer NOT NULL, \`last_seen_at\` integer NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS \`${DB_TABLE_NAMES.registeredTasks}\` (\`name\` text PRIMARY KEY NOT NULL, \`labels\` text, \`last_seen_at\` integer NOT NULL)`
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
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.tasksWorker}\" ON \"${DB_TABLE_NAMES.tasks}\" (\"worker\")`,
    `CREATE TABLE IF NOT EXISTS \"${DB_TABLE_NAMES.schedules}\" (\"id\" text PRIMARY KEY, \"source_name\" text NOT NULL, \"task_name\" text NOT NULL, \"cron\" text, \"cron_offset\" text, \"time\" timestamp with time zone, \"interval\" text, \"args\" jsonb, \"kwargs\" jsonb, \"labels\" jsonb, \"editable\" boolean NOT NULL, \"opaque\" boolean NOT NULL, \"status\" text NOT NULL, \"first_seen_at\" timestamp with time zone NOT NULL, \"last_seen_at\" timestamp with time zone NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.schedulesSourceName}\" ON \"${DB_TABLE_NAMES.schedules}\" (\"source_name\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.schedulesStatus}\" ON \"${DB_TABLE_NAMES.schedules}\" (\"status\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.schedulesTaskName}\" ON \"${DB_TABLE_NAMES.schedules}\" (\"task_name\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.schedulesLastSeenAt}\" ON \"${DB_TABLE_NAMES.schedules}\" (\"last_seen_at\")`,
    `CREATE TABLE IF NOT EXISTS \"${DB_TABLE_NAMES.scheduleCommands}\" (\"id\" text PRIMARY KEY, \"schedule_id\" text, \"source_name\" text NOT NULL, \"type\" text NOT NULL, \"payload\" jsonb NOT NULL, \"status\" text NOT NULL, \"error\" text, \"created_at\" timestamp with time zone NOT NULL, \"leased_at\" timestamp with time zone, \"resolved_at\" timestamp with time zone)`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.scheduleCommandsSourceName}\" ON \"${DB_TABLE_NAMES.scheduleCommands}\" (\"source_name\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.scheduleCommandsStatus}\" ON \"${DB_TABLE_NAMES.scheduleCommands}\" (\"status\")`,
    `CREATE INDEX IF NOT EXISTS \"${DB_INDEX_NAMES.scheduleCommandsCreatedAt}\" ON \"${DB_TABLE_NAMES.scheduleCommands}\" (\"created_at\")`,
    `CREATE TABLE IF NOT EXISTS \"${DB_TABLE_NAMES.scheduleSources}\" (\"name\" text PRIMARY KEY, \"editable\" boolean NOT NULL, \"last_seen_at\" timestamp with time zone NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS \"${DB_TABLE_NAMES.registeredTasks}\" (\"name\" text PRIMARY KEY, \"labels\" jsonb, \"last_seen_at\" timestamp with time zone NOT NULL)`
  ]
}
