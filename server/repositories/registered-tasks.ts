import { db } from '../../shared/db'
import { registeredTasksTable } from '../../shared/db/schema'
import { utcNow } from '../../shared/utils'
import { asc } from 'drizzle-orm'

class RegisteredTasksRepository {
  async upsertMany(tasks: { name: string; labels: Record<string, any> }[]) {
    const lastSeenAt = utcNow().toDate()
    for (const task of tasks) {
      await db
        .insert(registeredTasksTable)
        .values({ ...task, lastSeenAt })
        .onConflictDoUpdate({
          target: registeredTasksTable.name,
          set: { labels: task.labels, lastSeenAt }
        })
    }
  }

  async getAll() {
    return db
      .select()
      .from(registeredTasksTable)
      .orderBy(asc(registeredTasksTable.name))
  }
}

export const registeredTasksRepository = new RegisteredTasksRepository()
