import {
  taskQueuedRequestSchema,
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
  const body = await readValidatedBody(event, taskQueuedRequestSchema.parse)

  await tasksRepository.upsert(
    {
      id: params.id,
      returnValue: null,
      executionTime: null,
      state: 'queued',
      args: body.args,
      worker: body.worker,
      kwargs: body.kwargs,
      name: body.taskName,
      startedAt: null,
      queuedAt: body.queuedAt,
      finishedAt: null
    },
    ['queuedAt']
  )

  return { success: true }
})
