import { db } from '../../shared/db'
import { scheduleSourcesTable } from '../../shared/db/schema'
import { utcNow } from '../../shared/utils'
import { eq } from 'drizzle-orm'

class ScheduleSourcesRepository {
  async upsert(name: string, editable: boolean) {
    const lastSeenAt = utcNow().toDate()
    return db
      .insert(scheduleSourcesTable)
      .values({ name, editable, lastSeenAt })
      .onConflictDoUpdate({
        target: scheduleSourcesTable.name,
        set: { editable, lastSeenAt }
      })
  }

  async getAll() {
    return db.select().from(scheduleSourcesTable)
  }

  async getByName(name: string) {
    const result = await db
      .select()
      .from(scheduleSourcesTable)
      .where(eq(scheduleSourcesTable.name, name))

    if (result.length > 0) {
      return result[0]
    }

    return null
  }
}

export const scheduleSourcesRepository = new ScheduleSourcesRepository()
