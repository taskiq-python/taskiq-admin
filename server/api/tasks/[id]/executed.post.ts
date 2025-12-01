import {
  taskExecutedRequestSchema,
  taskRouteParamsSchema
} from '../../../../shared/schemas/tasks'
import { tasksRepository } from '../../../repositories/tasks'
import { envVariables } from '../../../../shared/env'
import {
  createError,
  defineEventHandler,
  getRequestHeader,
  getValidatedRouterParams,
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
  const params = await getValidatedRouterParams(
    event,
    taskRouteParamsSchema.parse
  )
  const body = await readValidatedBody(event, taskExecutedRequestSchema.parse)

  const state = body.error ? 'failure' : 'success'

  await tasksRepository.update(params.id, {
    state: state,
    error: body.error,
    finishedAt: body.finishedAt,
    returnValue: body.returnValue,
    executionTime: body.executionTime
  })

  return { success: true }
})
