import { registeredTasksSnapshotRequestSchema } from '../../../shared/schemas/schedules'
import { registeredTasksRepository } from '../../repositories/registered-tasks'
import { envVariables } from '../../../shared/env'
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
    registeredTasksSnapshotRequestSchema.parse
  )

  await registeredTasksRepository.upsertMany(
    body.tasks.map((task) => ({
      name: task.name,
      labels: task.labels as Record<string, any>
    }))
  )

  return { success: true }
})
