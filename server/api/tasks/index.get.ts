import { defineEventHandler, getValidatedQuery } from 'h3'
import { tasksRepository } from '../../repositories/tasks'
import { getTasksQueryParamsSchema } from '../../../shared/schemas/tasks'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, getTasksQueryParamsSchema.parse)

  const { tasks, count } = await tasksRepository.getAll({
    name: query.search ? query.search : null,
    limit: query.limit,
    offset: query.offset,
    state: query.state,
    sortByRuntime: query.sortByRuntime,
    sortByStartedAt: query.sortByStartedAt,
    sortByQueuedAt: query.sortByQueuedAt,
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined
  })

  return { tasks, count }
})
