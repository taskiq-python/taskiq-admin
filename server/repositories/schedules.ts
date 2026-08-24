import { and, count, desc, eq, like, lte, notInArray } from 'drizzle-orm'
import { db } from '../../shared/db'
import { schedulesTable } from '../../shared/db/schema'
import { takeUniqueOrThrow, utcNow } from '../../shared/utils'
import type { ScheduleCreate, ScheduleStatus } from '../../shared/types'

class SchedulesRepository {
  async getAll({
    name,
    limit,
    offset,
    sourceName,
    status
  }: {
    limit: number
    offset: number
    name: string | null
    sourceName?: string
    status?: ScheduleStatus
  }) {
    const whereConditions = []
    if (name) {
      whereConditions.push(
        like(schedulesTable.taskName, `%${name.toLowerCase()}%`)
      )
    }
    if (sourceName) {
      whereConditions.push(eq(schedulesTable.sourceName, sourceName))
    }
    if (status) {
      whereConditions.push(eq(schedulesTable.status, status))
    }

    const whereClause = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const countQuery = db
      .select({
        count: count()
      })
      .from(schedulesTable)

    const schedulesQuery = db.select().from(schedulesTable)

    const countResult = await (
      whereClause ? countQuery.where(whereClause) : countQuery
    ).then(takeUniqueOrThrow)

    const schedules = await (
      whereClause ? schedulesQuery.where(whereClause) : schedulesQuery
    )
      .orderBy(desc(schedulesTable.lastSeenAt))
      .limit(limit)
      .offset(offset)

    return { schedules, count: countResult.count }
  }

  async getById(scheduleId: string) {
    const result = await db
      .select()
      .from(schedulesTable)
      .where(eq(schedulesTable.id, scheduleId))

    if (result.length > 0) {
      return result[0]
    }

    return null
  }

  async syncSnapshot(sourceName: string, values: ScheduleCreate[]) {
    const now = utcNow().toDate()

    for (const value of values) {
      const set: Record<string, any> = { ...value }
      delete set.id
      delete set.firstSeenAt
      await db.insert(schedulesTable).values(value).onConflictDoUpdate({
        target: schedulesTable.id,
        set
      })
    }

    // Schedules of this source missing from the snapshot no longer
    // exist in the schedule source, so they are marked as removed.
    const whereConditions = [
      eq(schedulesTable.sourceName, sourceName),
      eq(schedulesTable.status, 'active')
    ]
    if (values.length > 0) {
      whereConditions.push(
        notInArray(
          schedulesTable.id,
          values.map((value) => value.id)
        )
      )
    }
    await db
      .update(schedulesTable)
      .set({ status: 'removed', lastSeenAt: now })
      .where(and(...whereConditions))
  }

  async deleteOldRemoved({ ttlMinutes }: { ttlMinutes: number }) {
    const now_ = utcNow()
    const dateToCompare = now_.subtract(ttlMinutes, 'minutes').toDate()
    return db
      .delete(schedulesTable)
      .where(
        and(
          eq(schedulesTable.status, 'removed'),
          lte(schedulesTable.lastSeenAt, dateToCompare)
        )
      )
  }
}

export const schedulesRepository = new SchedulesRepository()
