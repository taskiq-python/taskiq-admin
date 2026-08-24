import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, readValidatedBody } from '#imports'
import { scheduleCommandsRepository } from '../../repositories/schedule-commands'
import { scheduleSourcesRepository } from '../../repositories/schedule-sources'
import { createScheduleRequestSchema } from '../../../shared/schemas/schedules'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, createScheduleRequestSchema.parse)

  const source = await scheduleSourcesRepository.getByName(body.sourceName)
  if (!source) {
    throw createError({
      status: 404,
      statusMessage: 'Not Found',
      message: 'Unknown schedule source'
    })
  }
  if (!source.editable) {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Schedule source is read-only'
    })
  }

  const newScheduleId = randomUUID().replaceAll('-', '')
  const command = await scheduleCommandsRepository.create({
    scheduleId: newScheduleId,
    sourceName: body.sourceName,
    type: 'add',
    payload: {
      schedule_id: newScheduleId,
      task_name: body.taskName,
      labels: body.labels,
      args: body.args,
      kwargs: body.kwargs,
      cron: body.cron ?? null,
      cron_offset: body.cronOffset ?? null,
      time: body.time ? body.time.toISOString() : null,
      interval: body.interval === undefined ? null : body.interval
    }
  })

  return { success: true, newScheduleId, command }
})
