// In-process sqlite checks for the initialization statements themselves:
// they must be re-runnable, and the FTS triggers must stay in sync with the
// tasks table (a stale FTS index silently returns wrong search results).
import { beforeAll, expect, test } from 'vitest'
import { DB_TABLE_NAMES } from '../shared/db/constants'

process.env.TASKIQ_ADMIN_DB_DRIVER = 'sqlite'
process.env.TASKIQ_ADMIN_DB_FILE_PATH = ':memory:'
process.env.TASKIQ_ADMIN_BACKUP_FILE_PATH = ':memory:'
process.env.TASKIQ_ADMIN_API_TOKEN = 'supersecret'

const { db, initializeDatabase } = await import('../shared/db')
const { tasksRepository } = await import('../server/repositories/tasks')
const { sql } = await import('drizzle-orm')

const ftsCount = () =>
  db.get(
    sql`SELECT count(*) AS c FROM ${sql.identifier(DB_TABLE_NAMES.tasksFts)}`
  ).c as number

const tasksCount = () =>
  db.get(sql`SELECT count(*) AS c FROM ${sql.identifier(DB_TABLE_NAMES.tasks)}`)
    .c as number

const createTask = (id: string, name: string) =>
  tasksRepository.create({
    id,
    name,
    state: 'queued',
    queuedAt: new Date('2025-01-01T10:00:00Z')
  } as any)

beforeAll(async () => {
  await initializeDatabase()
})

test('initialization statements are re-runnable', async () => {
  await expect(initializeDatabase()).resolves.not.toThrow()
  await expect(initializeDatabase()).resolves.not.toThrow()
})

test('fts index stays in sync on insert, update and delete', async () => {
  await createTask('sync-1', 'myapp.tasks.send_email')
  await createTask('sync-2', 'myapp.tasks.other')
  expect(ftsCount()).toBe(tasksCount())

  await tasksRepository.update('sync-2', { state: 'success' })
  expect(ftsCount()).toBe(tasksCount())

  await db.delete((await import('../shared/db/schema')).tasksTable)
  expect(ftsCount()).toBe(0)
})
