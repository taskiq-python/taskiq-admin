import { defineEventHandler, getValidatedQuery } from 'h3'
import { scheduleCommandsRepository } from '../../../repositories/schedule-commands'
import { getScheduleCommandsQueryParamsSchema } from '../../../../shared/schemas/schedules'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(
    event,
    getScheduleCommandsQueryParamsSchema.parse
  )

  const { commands, count } = await scheduleCommandsRepository.getAll({
    limit: query.limit,
    offset: query.offset,
    sourceName: query.sourceName,
    scheduleId: query.scheduleId,
    status: query.status
  })

  return { commands, count }
})
