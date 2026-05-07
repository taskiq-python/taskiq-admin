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
    }>()
  },
  (t) => [
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
