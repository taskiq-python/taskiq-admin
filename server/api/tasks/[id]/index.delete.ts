import {
  createError,
  defineEventHandler,
  getValidatedRouterParams
} from '#imports'
import { tasksRepository } from '../../../repositories/tasks'
import { taskRouteParamsSchema } from '../../../../shared/schemas/tasks'

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    taskRouteParamsSchema.parse
  )

  const task = await tasksRepository.getById(params.id)
  if (!task) {
    throw createError({
      status: 404,
      statusMessage: 'Not Found',
      message: 'Task not found'
    })
  }
  if (task.state === 'running' || task.state === 'queued') {
    throw createError({
      status: 409,
      statusMessage: 'Conflict',
      message: 'Cannot delete a task that is still running'
    })
  }

  await tasksRepository.deleteById(params.id)

  return { success: true }
})
