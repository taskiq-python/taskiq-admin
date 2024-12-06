import {
  defineEventHandler,
  getValidatedRouterParams,
  readValidatedBody,
} from "h3"
import {
  taskExecutedRequestSchema,
  taskRouteParamsSchema,
} from "../../../schemas/tasks"
import { tasksRepository } from "../../../repositories/tasks"

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    taskRouteParamsSchema.parse
  )
  const body = await readValidatedBody(event, taskExecutedRequestSchema.parse)

  const state = body.error ? "failure" : "success"

  await tasksRepository.update(params.id, {
    state: state,
    error: body.error,
    finishedAt: body.finishedAt,
    returnValue: body.returnValue,
    executionTime: body.executionTime,
  })

  return { success: true }
})
