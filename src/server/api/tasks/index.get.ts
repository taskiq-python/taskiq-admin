import { defineEventHandler, getValidatedQuery } from "h3"
import { tasksRepository } from "../../repositories/tasks"
import { getTasksQueryParamsSchema } from "../../schemas/tasks"

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, getTasksQueryParamsSchema.parse)

  const { tasks, count } = await tasksRepository.getAll(
    query.search ? query.search : null,
    query.limit,
    query.offset
  )

  return { tasks, count }
})
