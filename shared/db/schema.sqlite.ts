import { type InferSelectModel, sql } from 'drizzle-orm'
import { int, text, real, sqliteTable, index } from 'drizzle-orm/sqlite-core'
import { DB_INDEX_NAMES, DB_TABLE_NAMES } from './constants'

export const tasksTable = sqliteTable(
  DB_TABLE_NAMES.tasks,
  {
    id: text().primaryKey(),
    name: text().notNull(),
    state: text({
      enum: ['queued', 'running', 'success', 'failure', 'abandoned']
    }).notNull(),
    error: text(),
    worker: text(),
    executionTime: real('execution_time'),
    queuedAt: int('queued_at', { mode: 'timestamp_ms' }).notNull(),
    startedAt: int('started_at', { mode: 'timestamp_ms' }),
    finishedAt: int('finished_at', { mode: 'timestamp_ms' }),
    args: text({ mode: 'json' }).$type<Array<any>>(),
    kwargs: text({ mode: 'json' }).$type<Record<string, any>>(),
    returnValue: text('return_value', { mode: 'json' }).$type<{
      return_value: any
    }>(),
    scheduleId: text('schedule_id')
  },
  (t) => [
    index(DB_INDEX_NAMES.tasksScheduleId).on(t.scheduleId),
    index(DB_INDEX_NAMES.tasksState).on(t.state),
    index(DB_INDEX_NAMES.tasksQueuedAt).on(t.queuedAt),
    index(DB_INDEX_NAMES.tasksStartedAt).on(t.startedAt),
    index(DB_INDEX_NAMES.tasksFinishedAt).on(t.finishedAt),
    index(DB_INDEX_NAMES.tasksExecutionTime).on(t.executionTime),
    index(DB_INDEX_NAMES.tasksName).on(sql`name COLLATE NOCASE`),
    index(DB_INDEX_NAMES.tasksWorker).on(sql`worker COLLATE NOCASE`)
  ]
)

export type TaskSelect = InferSelectModel<typeof tasksTable>

export const taskiqAdminSettingsTable = sqliteTable(DB_TABLE_NAMES.settings, {
  key: text('key').primaryKey(),
  value: text('value')
})

export type TaskiqAdminSettings = InferSelectModel<
  typeof taskiqAdminSettingsTable
>

export const schedulesTable = sqliteTable(
  DB_TABLE_NAMES.schedules,
  {
    id: text().primaryKey(),
    sourceName: text('source_name').notNull(),
    taskName: text('task_name').notNull(),
    cron: text(),
    cronOffset: text('cron_offset'),
    time: int({ mode: 'timestamp_ms' }),
    interval: text(),
    args: text({ mode: 'json' }).$type<Array<any>>(),
    kwargs: text({ mode: 'json' }).$type<Record<string, any>>(),
    labels: text({ mode: 'json' }).$type<Record<string, any>>(),
    editable: int({ mode: 'boolean' }).notNull(),
    opaque: int({ mode: 'boolean' }).notNull(),
    status: text({ enum: ['active', 'removed'] }).notNull(),
    firstSeenAt: int('first_seen_at', { mode: 'timestamp_ms' }).notNull(),
    lastSeenAt: int('last_seen_at', { mode: 'timestamp_ms' }).notNull()
  },
  (t) => [
    index(DB_INDEX_NAMES.schedulesSourceName).on(t.sourceName),
    index(DB_INDEX_NAMES.schedulesStatus).on(t.status),
    index(DB_INDEX_NAMES.schedulesTaskName).on(sql`task_name COLLATE NOCASE`),
    index(DB_INDEX_NAMES.schedulesLastSeenAt).on(t.lastSeenAt)
  ]
)

export type ScheduleSelect = InferSelectModel<typeof schedulesTable>

export const scheduleCommandsTable = sqliteTable(
  DB_TABLE_NAMES.scheduleCommands,
  {
    id: text().primaryKey(),
    scheduleId: text('schedule_id'),
    sourceName: text('source_name').notNull(),
    type: text({ enum: ['delete', 'add', 'trigger'] }).notNull(),
    payload: text({ mode: 'json' }).$type<Record<string, any>>().notNull(),
    status: text({
      enum: ['pending', 'leased', 'applied', 'failed']
    }).notNull(),
    error: text(),
    createdAt: int('created_at', { mode: 'timestamp_ms' }).notNull(),
    leasedAt: int('leased_at', { mode: 'timestamp_ms' }),
    resolvedAt: int('resolved_at', { mode: 'timestamp_ms' })
  },
  (t) => [
    index(DB_INDEX_NAMES.scheduleCommandsSourceName).on(t.sourceName),
    index(DB_INDEX_NAMES.scheduleCommandsStatus).on(t.status),
    index(DB_INDEX_NAMES.scheduleCommandsCreatedAt).on(t.createdAt)
  ]
)

export type ScheduleCommandSelect = InferSelectModel<
  typeof scheduleCommandsTable
>

export const scheduleSourcesTable = sqliteTable(DB_TABLE_NAMES.scheduleSources, {
  name: text().primaryKey(),
  editable: int({ mode: 'boolean' }).notNull(),
  lastSeenAt: int('last_seen_at', { mode: 'timestamp_ms' }).notNull()
})

export type ScheduleSourceSelect = InferSelectModel<typeof scheduleSourcesTable>

export const registeredTasksTable = sqliteTable(DB_TABLE_NAMES.registeredTasks, {
  name: text().primaryKey(),
  labels: text({ mode: 'json' }).$type<Record<string, any>>(),
  lastSeenAt: int('last_seen_at', { mode: 'timestamp_ms' }).notNull()
})

export type RegisteredTaskSelect = InferSelectModel<typeof registeredTasksTable>
