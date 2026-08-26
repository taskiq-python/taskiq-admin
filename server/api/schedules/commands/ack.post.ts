import { scheduleCommandsAckRequestSchema } from '../../../../shared/schemas/schedules'
import { scheduleCommandsRepository } from '../../../repositories/schedule-commands'
import { envVariables } from '../../../../shared/env'
import {
  createError,
  defineEventHandler,
  getRequestHeader,
  readValidatedBody
} from '#imports'

export default defineEventHandler(async (event) => {
  const accessToken = getRequestHeader(event, 'access-token')
  if (!accessToken || accessToken !== envVariables.taskiqAdminApiToken) {
    throw createError({
      status: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid access token'
    })
  }
  const body = await readValidatedBody(
    event,
    scheduleCommandsAckRequestSchema.parse
  )

  await scheduleCommandsRepository.ack(body.results)

  return { success: true }
})
