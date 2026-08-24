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

  await tasksRepository.deleteById(params.id)

  return { success: true }
})
