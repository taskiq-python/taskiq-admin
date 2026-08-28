import { $fetch } from '@nuxt/test-utils'
import { beforeAll, describe, expect, test } from 'vitest'
import { SEARCH_CASES, SEARCH_TASK_NAMES } from './search-fixtures'

const token = { 'access-token': 'supersecret' }

type TasksResponse = {
  count: number
  tasks: { id: string; name: string; state: string }[]
}

const fetchTasks = (query: Record<string, string | number>) =>
  $fetch<TasksResponse>('/api/tasks', {
    query: { limit: 100, offset: 0, ...query }
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

    test('count matches the number of returned rows', async () => {
      const result = await fetchTasks({ search: 'send' })
      expect(result.count).toBe(result.tasks.length)
    })

    test('count reflects the filter, not the whole table', async () => {
      const all = await fetchTasks({})
      const filtered = await fetchTasks({ search: 'send' })
      expect(all.count).toBe(SEARCH_TASK_NAMES.length)
      expect(filtered.count).toBe(2)
    })

    test('name search combines with the state filter', async () => {
      const matching = await fetchTasks({ search: 'send', state: 'queued' })
      expect(matching.count).toBe(2)

      const nonMatching = await fetchTasks({ search: 'send', state: 'success' })
      expect(nonMatching.count).toBe(0)
      expect(nonMatching.tasks).toEqual([])
    })

    test('pagination applies to the filtered set', async () => {
      const firstPage = await fetchTasks({ search: 'send', limit: 1 })
      expect(firstPage.tasks).toHaveLength(1)
      expect(firstPage.count).toBe(2)
    })
  })
}
