import {
  createError,
  defineEventHandler,
  getValidatedRouterParams
} from '#imports'
import { scheduleCommandsRepository } from '../../../../repositories/schedule-commands'
import { scheduleRouteParamsSchema } from '../../../../../shared/schemas/schedules'

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    scheduleRouteParamsSchema.parse
  )

  const command = await scheduleCommandsRepository.getById(params.id)
  if (!command) {
    throw createError({
      status: 404,
      statusMessage: 'Not Found',
      message: 'Command not found'
    })
  }
  if (command.status !== 'failed') {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Only failed commands can be retried'
    })
  }

  await scheduleCommandsRepository.retry(params.id)

  return { success: true }
})
