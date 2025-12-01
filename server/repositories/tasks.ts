import { db } from '../../shared/db'
import { tasksTable } from '../../shared/db/schema'
import { takeUniqueOrThrow, utcNow } from '../../shared/utils'
import { TaskCreate, TaskState } from '../../shared/types'
import { count, eq, desc, like, and, asc, gte, lte } from 'drizzle-orm'

class TasksRepository {
  async getAll({
    name,
    state,
    limit,
    offset,
    sortByRuntime,
    sortByStartedAt,
    sortByQueuedAt,
    startDate,
    endDate
  }: {
    limit: number
    offset: number
    name: string | null
    state?: TaskState
    sortByRuntime?: 'asc' | 'desc'
    sortByStartedAt?: 'asc' | 'desc'
    sortByQueuedAt?: 'asc' | 'desc'
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
    if (sortByQueuedAt) {
      sortConditions.push(orderMap[sortByQueuedAt](tasksTable.queuedAt))
    }
    if (sortConditions.length === 0) {
      sortConditions.push(desc(tasksTable.queuedAt))
    }

    const whereClause = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const countQuery = db
      .select({
        count: count()
      })
      .from(tasksTable)

    const tasksQuery = db.select().from(tasksTable)

    const countResult = await (
      whereClause ? countQuery.where(whereClause) : countQuery
    ).then(takeUniqueOrThrow)

    const tasks = await (
      whereClause ? tasksQuery.where(whereClause) : tasksQuery
    )
      .orderBy(...sortConditions)
      .limit(limit)
      .offset(offset)

    return { tasks, count: countResult.count }
  }

  async getById(taskId: string) {
    const result = await db
      .select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))

    if (result.length > 0) {
      return result[0]
    }

    return null
  }

  async create(values: TaskCreate) {
    return db.insert(tasksTable).values(values)
  }

  async upsert(
    values: TaskCreate,
    onConflictSet?: (keyof Pick<
      TaskCreate,
      'startedAt' | 'state' | 'queuedAt'
    >)[]
  ) {
    if (!onConflictSet || onConflictSet?.length === 0) {
      return db.insert(tasksTable).values(values).onConflictDoNothing({
        target: tasksTable.id
      })
    }

    const set: Record<string, any> = {}
    if (onConflictSet) {
      for (const key of onConflictSet) {
        set[key] = values[key]
      }
    }
    return db.insert(tasksTable).values(values).onConflictDoUpdate({
      target: tasksTable.id,
      set
    })
  }

  async update(
    taskId: string,
    values: {
      startedAt?: Date | null
      error?: string | null
      executionTime?: number
      finishedAt?: Date | null
      returnValue?: { return_value: any } | null
      state?: TaskState
    }
  ) {
    return db.update(tasksTable).set(values).where(eq(tasksTable.id, taskId))
  }

  async deleteOld({ ttlMinutes }: { ttlMinutes: number }) {
    const now_ = utcNow()
    const dateToCompate = now_.subtract(ttlMinutes, 'minutes').toDate()
    return db.delete(tasksTable).where(lte(tasksTable.queuedAt, dateToCompate))
  }

  async setAbandoned() {
    return db
      .update(tasksTable)
      .set({ state: 'abandoned' })
      .where(eq(tasksTable.state, 'running'))
  }
  async promoteToRunning(id: string, startedAt: Date) {
    return db
      .update(tasksTable)
      .set({ startedAt, state: 'running' })
      .where(and(eq(tasksTable.id, id), eq(tasksTable.state, 'queued')))
  }
}

export const tasksRepository = new TasksRepository()
