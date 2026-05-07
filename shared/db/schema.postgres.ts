import { type InferSelectModel } from 'drizzle-orm'
import {
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
    }>()
  },
  (t) => [
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
