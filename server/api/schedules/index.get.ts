import { defineEventHandler, getValidatedQuery } from 'h3'
import { schedulesRepository } from '../../repositories/schedules'
import { scheduleCommandsRepository } from '../../repositories/schedule-commands'
import { getSchedulesQueryParamsSchema } from '../../../shared/schemas/schedules'
import type {
  ScheduleCommandSelect,
  ScheduleSelect
} from '../../../shared/db/schema'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(
    event,
    getSchedulesQueryParamsSchema.parse
  )

  const { schedules, count } = await schedulesRepository.getAll({
    name: query.search ? query.search : null,
    limit: query.limit,
    offset: query.offset,
    sourceName: query.sourceName,
    status: query.status,
    kind: query.kind,
    scheduleId: query.scheduleId
  })

  const unresolvedCommands =
    await scheduleCommandsRepository.getUnresolvedForScheduleIds(
      schedules.map((schedule: ScheduleSelect) => schedule.id)
    )
  const pendingCommands: Record<string, string> = {}
  for (const command of unresolvedCommands as ScheduleCommandSelect[]) {
    if (command.scheduleId) {
      pendingCommands[command.scheduleId] = command.type
    }
  }

  return { schedules, count, pendingCommands }
})
