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
  if (schedule.opaque) {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Schedule arguments could not be serialized, cannot trigger'
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
    type: 'trigger',
    payload: {
      task_name: schedule.taskName,
      labels: schedule.labels ?? {},
      args: schedule.args ?? [],
      kwargs: schedule.kwargs ?? {}
    }
  })

  return { success: true, command }
})
