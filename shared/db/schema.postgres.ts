import { type InferSelectModel } from 'drizzle-orm'
import {
  boolean,
  index,
  jsonb,
  pgTable,
  real,
  text,
  timestamp
} from 'drizzle-orm/pg-core'
import { DB_INDEX_NAMES, DB_TABLE_NAMES } from './constants'

export const tasksTable = pgTable(
  DB_TABLE_NAMES.tasks,
  {
    id: text().primaryKey(),
    name: text().notNull(),
    state: text().notNull(),
    error: text(),
    worker: text(),
    executionTime: real('execution_time'),
    queuedAt: timestamp('queued_at', { withTimezone: true, mode: 'date' }).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    finishedAt: timestamp('finished_at', { withTimezone: true, mode: 'date' }),
    args: jsonb().$type<Array<any>>(),
    kwargs: jsonb().$type<Record<string, any>>(),
    returnValue: jsonb('return_value').$type<{
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
    index(DB_INDEX_NAMES.tasksName).on(t.name),
    index(DB_INDEX_NAMES.tasksWorker).on(t.worker)
  ]
)

export type TaskSelect = InferSelectModel<typeof tasksTable>

export const taskiqAdminSettingsTable = pgTable(DB_TABLE_NAMES.settings, {
  key: text('key').primaryKey(),
  value: text('value')
})

export type TaskiqAdminSettings = InferSelectModel<
  typeof taskiqAdminSettingsTable
>

export const schedulesTable = pgTable(
  DB_TABLE_NAMES.schedules,
  {
    id: text().primaryKey(),
    sourceName: text('source_name').notNull(),
    taskName: text('task_name').notNull(),
    cron: text(),
    cronOffset: text('cron_offset'),
    time: timestamp({ withTimezone: true, mode: 'date' }),
    interval: text(),
    args: jsonb().$type<Array<any>>(),
    kwargs: jsonb().$type<Record<string, any>>(),
    labels: jsonb().$type<Record<string, any>>(),
    editable: boolean().notNull(),
    opaque: boolean().notNull(),
    status: text().notNull(),
    firstSeenAt: timestamp('first_seen_at', {
      withTimezone: true,
      mode: 'date'
    }).notNull(),
    lastSeenAt: timestamp('last_seen_at', {
      withTimezone: true,
      mode: 'date'
    }).notNull()
  },
  (t) => [
    index(DB_INDEX_NAMES.schedulesSourceName).on(t.sourceName),
    index(DB_INDEX_NAMES.schedulesStatus).on(t.status),
    index(DB_INDEX_NAMES.schedulesTaskName).on(t.taskName),
    index(DB_INDEX_NAMES.schedulesLastSeenAt).on(t.lastSeenAt)
  ]
)

export type ScheduleSelect = InferSelectModel<typeof schedulesTable>

export const scheduleCommandsTable = pgTable(
  DB_TABLE_NAMES.scheduleCommands,
  {
    id: text().primaryKey(),
    scheduleId: text('schedule_id'),
    sourceName: text('source_name').notNull(),
    type: text().notNull(),
    payload: jsonb().$type<Record<string, any>>().notNull(),
    status: text().notNull(),
    error: text(),
    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date'
    }).notNull(),
    leasedAt: timestamp('leased_at', { withTimezone: true, mode: 'date' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' })
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

export const scheduleSourcesTable = pgTable(DB_TABLE_NAMES.scheduleSources, {
  name: text().primaryKey(),
  editable: boolean().notNull(),
  lastSeenAt: timestamp('last_seen_at', {
    withTimezone: true,
    mode: 'date'
  }).notNull()
})

export type ScheduleSourceSelect = InferSelectModel<typeof scheduleSourcesTable>

export const registeredTasksTable = pgTable(DB_TABLE_NAMES.registeredTasks, {
  name: text().primaryKey(),
  labels: jsonb().$type<Record<string, any>>(),
  lastSeenAt: timestamp('last_seen_at', {
    withTimezone: true,
    mode: 'date'
  }).notNull()
})

export type RegisteredTaskSelect = InferSelectModel<typeof registeredTasksTable>
