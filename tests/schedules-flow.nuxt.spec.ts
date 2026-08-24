import { setup, $fetch } from '@nuxt/test-utils'
import { resolve } from 'path'
import { expect, test } from 'vitest'

await setup({
  rootDir: resolve(__dirname, '..'),
  server: true, // up the Nitro server
  setupTimeout: 600_000,
  env: {
    NODE_ENV: 'test',
    TASKIQ_ADMIN_DB_DRIVER: 'sqlite',
    TASKIQ_ADMIN_DB_FILE_PATH: ':memory:',
    TASKIQ_ADMIN_BACKUP_FILE_PATH: ':memory:',
    TASKIQ_ADMIN_API_TOKEN: 'supersecret'
  }
})

const token = { 'access-token': 'supersecret' }

const snapshot = (schedules: Record<string, any>[]) =>
  $fetch<{ success: boolean }>('/api/schedules/snapshot', {
    method: 'POST',
    headers: token,
    body: {
      sourceName: 'redis',
      editable: true,
      scannedAt: new Date().toISOString(),
      schedules
    }
  })

const cronSchedule = {
  scheduleId: 'sched-cron',
  taskName: 'demo:cron',
  cron: '*/5 * * * *',
  cronOffset: null,
  time: null,
  interval: null,
  args: [],
  kwargs: {},
  labels: {}
}

const timeSchedule = {
  scheduleId: 'sched-oneoff',
  taskName: 'demo:oneoff',
  cron: null,
  cronOffset: null,
  time: '2030-01-01T10:00:00.000Z',
  interval: null,
  args: [1, 'two'],
  kwargs: { key: 'value' },
  labels: {}
}

test('snapshot requires the access token', async () => {
  await expect(
    $fetch('/api/schedules/snapshot', {
      method: 'POST',
      body: { sourceName: 'redis', editable: true, schedules: [] }
    })
  ).rejects.toThrowError()
})

test('snapshot, delete, poll, ack, removal round-trip', async () => {
  await snapshot([cronSchedule, timeSchedule])

  const list = await $fetch<{ schedules: any[]; count: number }>(
    '/api/schedules?limit=10&offset=0'
  )
  expect(list.count).toBe(2)

  const oneoff = await $fetch<any>('/api/schedules/sched-oneoff')
  expect(oneoff?.taskName).toBe('demo:oneoff')
  expect(oneoff?.status).toBe('active')
  expect(oneoff?.editable).toBe(true)
  expect(new Date(oneoff?.time).toISOString()).toBe(timeSchedule.time)

  const deleted = await $fetch<{ success: boolean }>(
    '/api/schedules/sched-oneoff',
    { method: 'DELETE' }
  )
  expect(deleted.success).toBe(true)

  const poll = await $fetch<{ commands: any[] }>(
    '/api/schedules/commands/poll',
    { method: 'POST', headers: token, body: { sourceName: 'redis' } }
  )
  expect(poll.commands.length).toBe(1)
  expect(poll.commands[0].type).toBe('delete')
  expect(poll.commands[0].status).toBe('leased')
  expect(poll.commands[0].payload.schedule_id).toBe('sched-oneoff')

  // A second poll must not return the already leased command.
  const secondPoll = await $fetch<{ commands: any[] }>(
    '/api/schedules/commands/poll',
    { method: 'POST', headers: token, body: { sourceName: 'redis' } }
  )
  expect(secondPoll.commands.length).toBe(0)

  await $fetch('/api/schedules/commands/ack', {
    method: 'POST',
    headers: token,
    body: {
      results: [{ id: poll.commands[0].id, status: 'applied', error: null }]
    }
  })

  const command = await $fetch<{ commands: any[] }>(
    '/api/schedules/commands?limit=10&offset=0&status=applied'
  )
  expect(command.commands.length).toBe(1)

  // The next snapshot no longer contains the deleted schedule,
  // so it must be marked as removed.
  await snapshot([cronSchedule])

  const active = await $fetch<{ count: number }>(
    '/api/schedules?limit=10&offset=0&status=active'
  )
  expect(active.count).toBe(1)

  const removed = await $fetch<any>('/api/schedules/sched-oneoff')
  expect(removed?.status).toBe('removed')
})

test('reschedule creates an atomic delete + add pair', async () => {
  const reschedule = await $fetch<{
    success: boolean
    newScheduleId: string
    commands: any[]
  }>('/api/schedules/sched-cron/reschedule', {
    method: 'POST',
    body: { cron: '0 3 * * *' }
  })
  expect(reschedule.success).toBe(true)
  expect(reschedule.commands.length).toBe(2)

  const poll = await $fetch<{ commands: any[] }>(
    '/api/schedules/commands/poll',
    { method: 'POST', headers: token, body: { sourceName: 'redis' } }
  )
  expect(poll.commands.map((command) => command.type)).toEqual([
    'delete',
    'add'
  ])
  const addCommand = poll.commands[1]
  expect(addCommand.payload.schedule_id).toBe(reschedule.newScheduleId)
  expect(addCommand.payload.task_name).toBe('demo:cron')
  expect(addCommand.payload.cron).toBe('0 3 * * *')

  await $fetch('/api/schedules/commands/ack', {
    method: 'POST',
    headers: token,
    body: {
      results: poll.commands.map((command) => ({
        id: command.id,
        status: 'applied',
        error: null
      }))
    }
  })
})

test('registered tasks can be reported, run and scheduled', async () => {
  await $fetch('/api/schedules/tasks-snapshot', {
    method: 'POST',
    headers: token,
    body: { tasks: [{ name: 'demo:unscheduled', labels: {} }] }
  })

  const tasks = await $fetch<{ tasks: any[] }>('/api/schedules/tasks')
  expect(tasks.tasks.map((task) => task.name)).toContain('demo:unscheduled')

  const sources = await $fetch<{ sources: any[] }>('/api/schedules/sources')
  expect(sources.sources.map((source) => source.name)).toContain('redis')

  const run = await $fetch<{ success: boolean; command: any }>(
    '/api/schedules/run',
    {
      method: 'POST',
      body: {
        taskName: 'demo:unscheduled',
        sourceName: 'redis',
        kwargs: { key: 'value' }
      }
    }
  )
  expect(run.command.type).toBe('trigger')
  expect(run.command.payload.task_name).toBe('demo:unscheduled')

  const created = await $fetch<{ success: boolean; newScheduleId: string }>(
    '/api/schedules/create',
    {
      method: 'POST',
      body: { taskName: 'demo:unscheduled', sourceName: 'redis', interval: 60 }
    }
  )
  expect(created.success).toBe(true)
})

test('trigger creates a trigger command', async () => {
  const trigger = await $fetch<{ success: boolean; command: any }>(
    '/api/schedules/sched-cron/trigger',
    { method: 'POST' }
  )
  expect(trigger.success).toBe(true)
  expect(trigger.command.type).toBe('trigger')
  expect(trigger.command.payload.task_name).toBe('demo:cron')

  // A second trigger is rejected while the first one is unresolved.
  await expect(
    $fetch('/api/schedules/sched-cron/trigger', { method: 'POST' })
  ).rejects.toThrowError()
})
