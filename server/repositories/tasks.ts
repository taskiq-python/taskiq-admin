import { db } from '../../shared/db'
import { tasksTable } from '../../shared/db/schema'
import { DB_TABLE_NAMES } from '../../shared/db/constants'
import { envVariables } from '../../shared/env'
import { utcNow } from '../../shared/utils'
import { TaskCreate, TaskState } from '../../shared/types'
import { eq, desc, and, asc, gte, lte, sql, like } from 'drizzle-orm'

const escapeLikePattern = (value: string) =>
  value.replace(/[\\%_]/g, (character) => `\\${character}`)

const buildNameCondition = (name: string) => {
  if (envVariables.dbDriver === 'postgres') {
    const pattern = `%${escapeLikePattern(name.toLowerCase())}%`
    return like(tasksTable.name, pattern)
  }
  // the trigram tokenizer cannot match terms shorter than 3 characters, fall back to LIKE
  if ([...name].length < 3) {
    const pattern = `%${escapeLikePattern(name.toLowerCase())}%`
    return sql`lower(${tasksTable.name}) LIKE ${pattern} ESCAPE '\\'`
  }
  // wrap user input as an FTS5 phrase query (escape embedded double quotes by doubling)
  const ftsQuery = `"${name.replace(/"/g, '""')}"`
  return sql`rowid IN (SELECT rowid FROM ${sql.identifier(
    DB_TABLE_NAMES.tasksFts
  )} WHERE name MATCH ${ftsQuery})`
}

class TasksRepository {
  async getAll({
    name,
    state,
    limit,
    cursor,
    direction = 'next',
    startDate,
    endDate
  }: {
    limit: number
    name: string | null
    state?: TaskState
    cursor?: { queuedAt: Date; id: string }
    direction?: 'next' | 'prev'
    startDate?: Date
    endDate?: Date
  }) {
    const whereConditions = []
    if (name) {
      whereConditions.push(buildNameCondition(name))
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
    const isNext = direction === 'next'
    if (cursor) {
      const cursorQueuedAt = sql.param(cursor.queuedAt, tasksTable.queuedAt)
      whereConditions.push(
        isNext
          ? sql`(${tasksTable.queuedAt}, ${tasksTable.id}) < (${cursorQueuedAt}, ${cursor.id})`
          : sql`(${tasksTable.queuedAt}, ${tasksTable.id}) > (${cursorQueuedAt}, ${cursor.id})`
      )
    }

    const order = isNext ? desc : asc
    const rows = await db
      .select()
      .from(tasksTable)
      .where(whereConditions.length ? and(...whereConditions) : undefined)
      .orderBy(order(tasksTable.queuedAt), order(tasksTable.id))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const tasks = rows.slice(0, limit)
    if (!isNext) {
      tasks.reverse()
    }

    const hasNext = isNext ? hasMore : tasks.length > 0
    const hasPrev = isNext ? !!cursor : hasMore
    const toCursor = (task?: (typeof tasks)[number]) =>
      task ? { queuedAt: task.queuedAt.toISOString(), id: task.id } : null

    return {
      tasks,
      nextCursor: hasNext ? toCursor(tasks[tasks.length - 1]) : null,
      prevCursor: hasPrev ? toCursor(tasks[0]) : null
    }
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
