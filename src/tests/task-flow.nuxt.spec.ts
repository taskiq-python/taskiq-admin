// tests/task-flow.nuxt.spec.ts
import { setup, $fetch } from '@nuxt/test-utils'
import { resolve } from 'path'
import { expect, test } from 'vitest'

await setup({
  rootDir: resolve(__dirname, '..'),
  server: true, // up the Nitro server
  env: {
    NODE_ENV: 'test',
    DB_FILE_PATH: ':memory:',
    BACKUP_FILE_PATH: ':memory:',
    TASKIQ_ADMIN_API_TOKEN: 'supersecret'
  }
})

const id = 'nuxt-spec-1'
const token = { 'access-token': 'supersecret' }
const queued = new Date('2025-01-01T10:00:00Z')
const start = new Date('2025-01-01T10:00:02Z')
const finish = new Date('2025-01-01T10:00:05Z')

test('started → queued → executed saves dates', async () => {
  await $fetch(`/api/tasks/${id}/started`, {
    method: 'POST',
    headers: token,
    body: {
      taskName: 'demo',
      args: [],
      kwargs: {},
      worker: 'w',
      startedAt: start.toISOString()
    }
  })

  await $fetch(`/api/tasks/${id}/queued`, {
    method: 'POST',
    headers: token,
    body: {
      taskName: 'demo',
      args: [],
      kwargs: {},
      worker: 'w',
      queuedAt: queued.toISOString()
    }
  })

  await $fetch(`/api/tasks/${id}/executed`, {
    method: 'POST',
    headers: token,
    body: {
      error: null,
      executionTime: 3,
      finishedAt: finish.toISOString(),
      returnValue: { return_value: 'ok' }
    }
  })

  const task = await $fetch(`/api/tasks/${id}`)

  expect(task?.state).toBe('success')
  expect(task?.queuedAt).toBe(queued.toISOString())
  expect(task?.startedAt).toBe(start.toISOString())
  expect(task?.finishedAt).toBe(finish.toISOString())
})
