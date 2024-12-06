import { db } from "../db"
import { tasksTable } from "../db/schema"
import { count, eq, desc, ilike } from "drizzle-orm"
import { takeUniqueOrThrow } from "../utils"

export type TaskState = "pending" | "success" | "failed"

class TasksRepository {
  async getAll(name: string | null, limit: number, offset: number) {
    const whereCondition = name
      ? ilike(tasksTable.name, `%${name}%`)
      : undefined

    const countResult = await db
      .select({
        count: count(),
      })
      .from(tasksTable)
      .where(whereCondition)
      .then(takeUniqueOrThrow)

    const tasks = await db
      .select()
      .from(tasksTable)
      .where(whereCondition)
      .orderBy(desc(tasksTable.startedAt))
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
    worker: string
    startedAt: Date
    args: Record<string, any>
    kwargs: Record<string, any>
    executionTime: number | null
    returnValue: Record<string, any> | null
    finishedAt: Date | null
    state: "success" | "pending" | "failure"
  }) {
    return db.insert(tasksTable).values(values)
  }

  async update(
    taskId: string,
    values: {
      state?: "success" | "pending" | "failure"
      error?: string | null
      executionTime?: number
      finishedAt?: Date | null
      returnValue?: object | null
    }
  ) {
    return db.update(tasksTable).set(values).where(eq(tasksTable.id, taskId))
  }
}

export const tasksRepository = new TasksRepository()
