import {
  taskRouteParamsSchema,
  taskStartedRequestSchema
} from '../../../../shared/schemas/tasks'
import { envVariables } from '../../../../shared/env'
import { tasksRepository } from '../../../repositories/tasks'
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
  const body = await readValidatedBody(event, taskStartedRequestSchema.parse)

  // Upserts the task if QUEUED event has not been received yet
  await tasksRepository.upsert(
    {
      id: params.id,
      returnValue: null,
      executionTime: null,
      state: 'running',
      args: body.args,
      worker: body.worker,
      kwargs: body.kwargs,
      name: body.taskName,
      queuedAt: body.startedAt,
      startedAt: body.startedAt,
      finishedAt: null
    },
    ['startedAt']
  )
  await tasksRepository.promoteToRunning(params.id, body.startedAt)

  return { success: true }
})
