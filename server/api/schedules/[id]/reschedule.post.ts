import { randomUUID } from 'node:crypto'
import {
  createError,
  defineEventHandler,
  getValidatedRouterParams,
  readValidatedBody
} from '#imports'
import { schedulesRepository } from '../../../repositories/schedules'
import { scheduleCommandsRepository } from '../../../repositories/schedule-commands'
import {
  rescheduleRequestSchema,
  scheduleRouteParamsSchema
} from '../../../../shared/schemas/schedules'

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    scheduleRouteParamsSchema.parse
  )
  const body = await readValidatedBody(event, rescheduleRequestSchema.parse)

  const schedule = await schedulesRepository.getById(params.id)
  if (!schedule) {
    throw createError({
      status: 404,
      statusMessage: 'Not Found',
      message: 'Schedule not found'
    })
  }
  if (!schedule.editable) {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Schedule source is read-only'
    })
  }
  if (schedule.status !== 'active') {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Schedule is not active'
    })
  }
  if (schedule.opaque) {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Schedule arguments could not be serialized, cannot reschedule'
    })
  }
  if (await scheduleCommandsRepository.hasUnresolvedForSchedule(schedule.id)) {
    throw createError({
      status: 409,
      statusMessage: 'Conflict',
      message: 'Schedule already has a pending command'
    })
  }

  const cron = body.cron !== undefined ? body.cron : schedule.cron
  const cronOffset =
    body.cronOffset !== undefined ? body.cronOffset : schedule.cronOffset
  const time = body.time !== undefined ? body.time : schedule.time
  const interval =
    body.interval !== undefined
      ? body.interval === null
        ? null
        : String(body.interval)
      : schedule.interval
  if (!cron && !time && !interval) {
    throw createError({
      status: 400,
      statusMessage: 'Bad Request',
      message: 'Either cron, time or interval must be present'
    })
  }

  // Rescheduling is a delete + add with a fresh schedule id, because
  // the scheduler keeps last-run bookkeeping per schedule id.
  const newScheduleId = randomUUID().replaceAll('-', '')
  const commands = await scheduleCommandsRepository.createMany([
    {
      scheduleId: schedule.id,
      sourceName: schedule.sourceName,
      type: 'delete',
      payload: { schedule_id: schedule.id }
    },
    {
      scheduleId: newScheduleId,
      sourceName: schedule.sourceName,
      type: 'add',
      payload: {
        schedule_id: newScheduleId,
        task_name: schedule.taskName,
        labels: schedule.labels ?? {},
        args: body.args ?? schedule.args ?? [],
        kwargs: body.kwargs ?? schedule.kwargs ?? {},
        cron,
        cron_offset: cronOffset,
        time: time ? time.toISOString() : null,
        interval
      }
    }
  ])

  return { success: true, newScheduleId, commands }
})
