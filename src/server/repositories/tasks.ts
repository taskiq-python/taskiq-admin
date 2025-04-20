import { db } from '../db'
import { tasksTable } from '../db/schema'
import { takeUniqueOrThrow } from '../utils'
import { count, eq, desc, like, and, asc, gte, lte } from 'drizzle-orm'

export type TaskState = 'running' | 'success' | 'failed' | 'abandoned'

class TasksRepository {
  async getAll({
    name,
    state,
    limit,
    offset,
    sortByRuntime,
    sortByStartedAt,
    startDate,
    endDate
  }: {
    limit: number
    offset: number
    name: string | null
    state?: 'success' | 'running' | 'failure' | 'abandoned'
    sortByRuntime?: 'asc' | 'desc'
    sortByStartedAt?: 'asc' | 'desc'
    startDate?: Date
    endDate?: Date
  }) {
    const whereConditions = []
    if (name) {
      whereConditions.push(like(tasksTable.name, `%${name.toLowerCase()}%`))
    }
    if (state) {
      whereConditions.push(eq(tasksTable.state, state))
    }
    if (startDate) {
      whereConditions.push(gte(tasksTable.startedAt, startDate))
    }
    if (endDate) {
      whereConditions.push(lte(tasksTable.startedAt, endDate))
    }

    const orderMap = { asc, desc }
    const sortConditions = []
    if (sortByRuntime) {
      sortConditions.push(orderMap[sortByRuntime](tasksTable.executionTime))
    }
    if (sortByStartedAt) {
      sortConditions.push(orderMap[sortByStartedAt](tasksTable.startedAt))
    }
    if (sortConditions.length === 0) {
      sortConditions.push(desc(tasksTable.startedAt))
    }
    if (startDate) {
    }

    const countResult = await db
      .select({
        count: count()
      })
      .from(tasksTable)
      .where(and(...whereConditions))
      .then(takeUniqueOrThrow)

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(and(...whereConditions))
      .orderBy(...sortConditions)
      .limit(limit)
      .offset(offset)

    return { tasks, count: countResult.count }
  }

  async getById(taskId: string) {
    return db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .then(takeUniqueOrThrow)
  }

  async create(values: {
    id: string
    name: string
    startedAt: Date
    args: Array<any>
    worker: string | null
    finishedAt: Date | null
    kwargs: Record<string, any>
    executionTime: number | null
    returnValue: { return_value: any } | null
    state: 'success' | 'running' | 'failure'
  }) {
    return db.insert(tasksTable).values(values)
  }

  async update(
    taskId: string,
    values: {
      error?: string | null
      executionTime?: number
      finishedAt?: Date | null
      returnValue?: { return_value: any } | null
      state?: 'success' | 'running' | 'failure' | 'abandoned'
    }
  ) {
    return db.update(tasksTable).set(values).where(eq(tasksTable.id, taskId))
  }

  async setAbandoned() {
    return db
      .update(tasksTable)
      .set({ state: 'abandoned' })
      .where(eq(tasksTable.state, 'running'))
  }
}

export const tasksRepository = new TasksRepository()
