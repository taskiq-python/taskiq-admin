import { $fetch } from '@nuxt/test-utils'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { SEARCH_CASES, SEARCH_TASK_NAMES } from './search-fixtures'

const token = { 'access-token': 'supersecret' }

type TasksResponse = {
  tasks: { id: string; name: string; state: string }[]
  nextCursor: { queuedAt: string; id: string } | null
  prevCursor: { queuedAt: string; id: string } | null
}

const fetchTasks = (query: Record<string, string | number>) =>
  $fetch<TasksResponse>('/api/tasks', {
    query: { limit: 100, ...query }
  })

const seedTasks = async (idPrefix: string) => {
  for (const [index, taskName] of SEARCH_TASK_NAMES.entries()) {
    await $fetch(`/api/tasks/${idPrefix}-${index}/queued`, {
      method: 'POST',
      headers: token,
      body: {
        taskName,
        args: [],
        kwargs: {},
        worker: 'w',
        queuedAt: new Date('2025-01-01T10:00:00Z').toISOString()
      }
    })
  }
}

export const registerSearchTests = (driver: 'sqlite' | 'postgres') => {
  describe(`task name search (${driver})`, () => {
    beforeAll(async () => {
      await seedTasks('search')
    })

    for (const { title, query, expected } of SEARCH_CASES) {
      test(`${title}: ${JSON.stringify(query)}`, async () => {
        const result = await fetchTasks({ search: query })
        expect(result.tasks.map((task) => task.name).sort()).toEqual(
          [...expected].sort()
        )
      })
    }

    test('name search combines with the state filter', async () => {
      const matching = await fetchTasks({ search: 'send', state: 'queued' })
      expect(matching.tasks).toHaveLength(2)

      const nonMatching = await fetchTasks({ search: 'send', state: 'success' })
      expect(nonMatching.tasks).toEqual([])
      expect(nonMatching.nextCursor).toBeNull()
    })

    test('cursor pagination walks forward and back over the filtered set', async () => {
      const first = await fetchTasks({ search: 'send', limit: 1 })
      expect(first.tasks).toHaveLength(1)
      expect(first.prevCursor).toBeNull()
      expect(first.nextCursor).not.toBeNull()

      const second = await fetchTasks({
        search: 'send',
        limit: 1,
        cursorQueuedAt: first.nextCursor!.queuedAt,
        cursorId: first.nextCursor!.id
      })
      expect(second.tasks).toHaveLength(1)
      expect(second.tasks[0]!.id).not.toBe(first.tasks[0]!.id)
      expect(second.nextCursor).toBeNull()
      expect(second.prevCursor).not.toBeNull()

      const back = await fetchTasks({
        search: 'send',
        limit: 1,
        direction: 'prev',
        cursorQueuedAt: second.prevCursor!.queuedAt,
        cursorId: second.prevCursor!.id
      })
      expect(back.tasks.map((t) => t.id)).toEqual([first.tasks[0]!.id])
      expect(back.prevCursor).toBeNull()
    })

    test('rejects a cursor with only one field', async () => {
      await expect(
        fetchTasks({ cursorId: 'x' })
      ).rejects.toMatchObject({ statusCode: 400 })
    })

    describe(`task args search (${driver})`, () => {
      const queue = (
        id: string,
        args: unknown[],
        kwargs: Record<string, unknown>
      ) =>
        $fetch(`/api/tasks/${id}/queued`, {
          method: 'POST',
          headers: token,
          body: {
            taskName: 'args.task',
            args,
            kwargs,
            worker: 'w',
            queuedAt: new Date('2025-01-02T10:00:00Z').toISOString()
          }
        })

      // seeded lazily: @nuxt/test-utils drops its context after each test,
      // so a nested beforeAll would run without it
      let seeded = false
      beforeEach(async () => {
        if (seeded) return
        seeded = true
        await queue('args-0', ['000123', 42], {})
        await queue('args-1', [], { customer_id: '000777', lang: 'KG' })
        await queue('args-2', ['100%_done'], { note: 'Привет' })
      })

      const ids = async (query: Record<string, string>) =>
        (await fetchTasks(query)).tasks.map((task) => task.id).sort()

      test('matches a value in args', async () => {
        expect(await ids({ argsSearch: '000123' })).toEqual(['args-0'])
      })

      test('matches a value in kwargs', async () => {
        expect(await ids({ argsSearch: '000777' })).toEqual(['args-1'])
      })

      test('matches a kwargs key', async () => {
        expect(await ids({ argsSearch: 'customer_id' })).toEqual(['args-1'])
      })

      test('is case insensitive', async () => {
        expect(await ids({ argsSearch: 'kg' })).toEqual(['args-1'])
      })

      test('matches non-ascii values', async () => {
        expect(await ids({ argsSearch: 'Привет' })).toEqual(['args-2'])
      })

      test('treats % and _ as literal characters', async () => {
        expect(await ids({ argsSearch: '0%_d' })).toEqual(['args-2'])
        expect(await ids({ argsSearch: '1%done' })).toEqual([])
      })

      test('combines with name search', async () => {
        expect(await ids({ argsSearch: '000', search: 'args.task' })).toEqual([
          'args-0',
          'args-1'
        ])
        expect(await ids({ argsSearch: '000', search: 'send' })).toEqual([])
      })
    })
  })
}
