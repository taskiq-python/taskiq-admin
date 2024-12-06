import {
  defineEventHandler,
  getValidatedRouterParams,
  readValidatedBody,
} from "h3"
import {
  taskRouteParamsSchema,
  taskStartedRequestSchema,
} from "../../../schemas/tasks"
import { tasksRepository } from "../../../repositories/tasks"

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    taskRouteParamsSchema.parse
  )
  const body = await readValidatedBody(event, taskStartedRequestSchema.parse)

  await tasksRepository.create({
    finishedAt: null,
    returnValue: null,
    executionTime: null,
    state: "pending",
    args: body.args,
    id: params.id,
    worker: body.worker,
    kwargs: body.kwargs,
    name: body.taskName,
    startedAt: body.startedAt,
  })
  return {
    success: true,
  }
})
