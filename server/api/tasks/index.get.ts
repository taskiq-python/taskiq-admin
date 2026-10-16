import { defineEventHandler, getValidatedQuery } from 'h3'
import { tasksRepository } from '../../repositories/tasks'
import { getTasksQueryParamsSchema } from '../../../shared/schemas/tasks'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, getTasksQueryParamsSchema.parse)

  return tasksRepository.getAll({
    name: query.search ? query.search : null,
    limit: query.limit,
    state: query.state,
    startDate: query.startDate,
    endDate: query.endDate,
    cursor:
      query.cursorQueuedAt && query.cursorId
        ? { queuedAt: query.cursorQueuedAt, id: query.cursorId }
        : undefined,
    direction: query.direction
  })
})
