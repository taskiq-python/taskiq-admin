import { createError, defineEventHandler, readValidatedBody } from '#imports'
import { scheduleCommandsRepository } from '../../repositories/schedule-commands'
import { scheduleSourcesRepository } from '../../repositories/schedule-sources'
import { runTaskRequestSchema } from '../../../shared/schemas/schedules'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, runTaskRequestSchema.parse)

  const source = await scheduleSourcesRepository.getByName(body.sourceName)
  if (!source) {
    throw createError({
      status: 404,
      statusMessage: 'Not Found',
      message: 'Unknown schedule source'
    })
  }

  const command = await scheduleCommandsRepository.create({
    scheduleId: null,
    sourceName: body.sourceName,
    type: 'trigger',
    payload: {
      task_name: body.taskName,
      labels: body.labels,
      args: body.args,
      kwargs: body.kwargs
    }
  })

  return { success: true, command }
})
