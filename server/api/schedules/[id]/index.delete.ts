import {
  createError,
  defineEventHandler,
  getValidatedRouterParams
} from '#imports'
import { schedulesRepository } from '../../../repositories/schedules'
import { scheduleCommandsRepository } from '../../../repositories/schedule-commands'
import { scheduleRouteParamsSchema } from '../../../../shared/schemas/schedules'

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    scheduleRouteParamsSchema.parse
  )

  const schedule = await schedulesRepository.getById(params.id)
  if (!schedule) {
    throw createError({
      status: 404,
      statusMessage: 'Not Found',
      message: 'Schedule not found'
    })
  }
  if (!schedule.editable) {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Schedule source is read-only'
    })
  }
  if (schedule.status !== 'active') {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Schedule is not active'
    })
  }
  if (await scheduleCommandsRepository.hasUnresolvedForSchedule(schedule.id)) {
    throw createError({
      status: 409,
      statusMessage: 'Conflict',
      message: 'Schedule already has a pending command'
    })
  }

  const command = await scheduleCommandsRepository.create({
    scheduleId: schedule.id,
    sourceName: schedule.sourceName,
    type: 'delete',
    payload: { schedule_id: schedule.id }
  })

  return { success: true, command }
})
