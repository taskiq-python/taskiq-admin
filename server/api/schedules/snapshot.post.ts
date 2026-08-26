import { scheduleSnapshotRequestSchema } from '../../../shared/schemas/schedules'
import { schedulesRepository } from '../../repositories/schedules'
import { scheduleSourcesRepository } from '../../repositories/schedule-sources'
import { envVariables } from '../../../shared/env'
import { utcNow } from '../../../shared/utils'
import type { ScheduleCreate } from '../../../shared/types'
import {
  createError,
  defineEventHandler,
  getRequestHeader,
  readValidatedBody
} from '#imports'

export default defineEventHandler(async (event) => {
  const accessToken = getRequestHeader(event, 'access-token')
  if (!accessToken || accessToken !== envVariables.taskiqAdminApiToken) {
    throw createError({
      status: 401,
      statusMessage: 'Unauthorized',
      message: 'Invalid access token'
    })
  }
  const body = await readValidatedBody(
    event,
    scheduleSnapshotRequestSchema.parse
  )

  const now = utcNow().toDate()
  const values: ScheduleCreate[] = body.schedules.map((schedule) => ({
    id: schedule.scheduleId,
    sourceName: body.sourceName,
    taskName: schedule.taskName,
    cron: schedule.cron,
    cronOffset: schedule.cronOffset,
    time: schedule.time,
    interval: schedule.interval === null ? null : String(schedule.interval),
    args: schedule.args as Array<any>,
    kwargs: schedule.kwargs as Record<string, any>,
    labels: schedule.labels as Record<string, any>,
    editable: body.editable,
    opaque: schedule.opaque ?? false,
    status: 'active',
    firstSeenAt: now,
    lastSeenAt: now
  }))

  await scheduleSourcesRepository.upsert(body.sourceName, body.editable)
  await schedulesRepository.syncSnapshot(body.sourceName, values)

  return { success: true }
})
