import { defineEventHandler, getValidatedRouterParams } from "h3"
import { taskRouteParamsSchema } from "../../../schemas/tasks"
import { tasksRepository } from "../../../repositories/tasks"

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    taskRouteParamsSchema.parse
  )

  return await tasksRepository.getById(params.id)
})
