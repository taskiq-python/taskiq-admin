import { randomUUID } from 'node:crypto'
import { and, count, desc, eq, inArray, lte, ne } from 'drizzle-orm'
import { db } from '../../shared/db'
import { scheduleCommandsTable } from '../../shared/db/schema'
import { takeUniqueOrThrow, utcNow } from '../../shared/utils'
import type {
  ScheduleCommandCreate,
  ScheduleCommandStatus,
  ScheduleCommandType
} from '../../shared/types'

const LEASE_TTL_MINUTES = 5

type ScheduleCommandInput = {
  scheduleId: string | null
  sourceName: string
  type: ScheduleCommandType
  payload: Record<string, any>
}

class ScheduleCommandsRepository {
  buildCommand(input: ScheduleCommandInput): ScheduleCommandCreate {
    return {
      ...input,
      id: randomUUID(),
      status: 'pending',
      error: null,
      createdAt: utcNow().toDate(),
      leasedAt: null,
      resolvedAt: null
    }
  }

  async getAll({
    limit,
    offset,
    sourceName,
    scheduleId,
    status
  }: {
    limit: number
    offset: number
    sourceName?: string
    scheduleId?: string
    status?: ScheduleCommandStatus
  }) {
    const whereConditions = []
    if (sourceName) {
      whereConditions.push(eq(scheduleCommandsTable.sourceName, sourceName))
    }
    if (scheduleId) {
      whereConditions.push(eq(scheduleCommandsTable.scheduleId, scheduleId))
    }
    if (status) {
      whereConditions.push(eq(scheduleCommandsTable.status, status))
    }

    const whereClause = whereConditions.length
      ? and(...whereConditions)
      : undefined

    const countQuery = db
      .select({
        count: count()
      })
      .from(scheduleCommandsTable)

    const commandsQuery = db.select().from(scheduleCommandsTable)

    const countResult = await (
      whereClause ? countQuery.where(whereClause) : countQuery
    ).then(takeUniqueOrThrow)

    const commands = await (
      whereClause ? commandsQuery.where(whereClause) : commandsQuery
    )
      .orderBy(desc(scheduleCommandsTable.createdAt))
      .limit(limit)
      .offset(offset)

    return { commands, count: countResult.count }
  }

  async getById(commandId: string) {
    const result = await db
      .select()
      .from(scheduleCommandsTable)
      .where(eq(scheduleCommandsTable.id, commandId))

    if (result.length > 0) {
      return result[0]
    }

    return null
  }

  async create(input: ScheduleCommandInput) {
    const command = this.buildCommand(input)
    await db.insert(scheduleCommandsTable).values(command)
    return command
  }

  // A single insert statement, so a pair of commands
  // (e.g. delete + add for a reschedule) is stored atomically.
  async createMany(inputs: ScheduleCommandInput[]) {
    const commands = inputs.map((input) => this.buildCommand(input))
    await db.insert(scheduleCommandsTable).values(commands)
    return commands
  }

  async hasUnresolvedForSchedule(scheduleId: string) {
    const unresolved = await this.getUnresolvedForScheduleIds([scheduleId])
    return unresolved.length > 0
  }

  async getUnresolvedForScheduleIds(scheduleIds: string[]) {
    if (scheduleIds.length === 0) {
      return []
    }
    return db
      .select()
      .from(scheduleCommandsTable)
      .where(
        and(
          inArray(scheduleCommandsTable.scheduleId, scheduleIds),
          inArray(scheduleCommandsTable.status, ['pending', 'leased'])
        )
      )
  }

  async lease(sourceName: string) {
    const now = utcNow().toDate()
    const leaseCutoff = utcNow()
      .subtract(LEASE_TTL_MINUTES, 'minutes')
      .toDate()

    // Trigger commands are not idempotent, so an expired lease fails
    // them instead of retrying, to never fire a task twice silently.
    await db
      .update(scheduleCommandsTable)
      .set({ status: 'failed', error: 'Lease expired', resolvedAt: now })
      .where(
        and(
          eq(scheduleCommandsTable.sourceName, sourceName),
          eq(scheduleCommandsTable.status, 'leased'),
          lte(scheduleCommandsTable.leasedAt, leaseCutoff),
          eq(scheduleCommandsTable.type, 'trigger')
        )
      )

    // Delete and add commands are idempotent and safe to re-lease.
    await db
      .update(scheduleCommandsTable)
      .set({ status: 'pending', leasedAt: null })
      .where(
        and(
          eq(scheduleCommandsTable.sourceName, sourceName),
          eq(scheduleCommandsTable.status, 'leased'),
          lte(scheduleCommandsTable.leasedAt, leaseCutoff),
          ne(scheduleCommandsTable.type, 'trigger')
        )
      )

    const leased = await db
      .update(scheduleCommandsTable)
      .set({ status: 'leased', leasedAt: now })
      .where(
        and(
          eq(scheduleCommandsTable.sourceName, sourceName),
          eq(scheduleCommandsTable.status, 'pending')
        )
      )
      .returning()

    return leased.sort(
      (a: ScheduleCommandCreate, b: ScheduleCommandCreate) =>
        a.createdAt.getTime() - b.createdAt.getTime()
    )
  }

  async ack(
    results: {
      id: string
      status: 'applied' | 'failed'
      error: string | null
    }[]
  ) {
    const now = utcNow().toDate()
    for (const result of results) {
      await db
        .update(scheduleCommandsTable)
        .set({ status: result.status, error: result.error, resolvedAt: now })
        .where(
          and(
            eq(scheduleCommandsTable.id, result.id),
            eq(scheduleCommandsTable.status, 'leased')
          )
        )
    }
  }

  async retry(commandId: string) {
    return db
      .update(scheduleCommandsTable)
      .set({ status: 'pending', error: null, leasedAt: null, resolvedAt: null })
      .where(
        and(
          eq(scheduleCommandsTable.id, commandId),
          eq(scheduleCommandsTable.status, 'failed')
        )
      )
  }

  async deleteOldResolved({ ttlMinutes }: { ttlMinutes: number }) {
    const now_ = utcNow()
    const dateToCompare = now_.subtract(ttlMinutes, 'minutes').toDate()
    return db
      .delete(scheduleCommandsTable)
      .where(
        and(
          inArray(scheduleCommandsTable.status, ['applied', 'failed']),
          lte(scheduleCommandsTable.resolvedAt, dateToCompare)
        )
      )
  }
}

export const scheduleCommandsRepository = new ScheduleCommandsRepository()
