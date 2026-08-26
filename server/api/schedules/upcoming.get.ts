import { CronExpressionParser } from 'cron-parser'
import { defineEventHandler } from 'h3'
import { schedulesRepository } from '../../repositories/schedules'
import type { ScheduleSelect } from '../../../shared/db/schema'

// Interval is stored as taskiq serialized it: plain seconds ("300")
// or an ISO 8601 duration ("PT5M").
const parseIntervalSeconds = (interval: string): number | null => {
  if (/^\d+$/.test(interval)) {
    return Number(interval)
  }
  const match = interval.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/)
  if (!match) {
    return null
  }
  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}

const nextCronRun = (schedule: ScheduleSelect): Date | null => {
  const parseOptions = schedule.cronOffset ? { tz: schedule.cronOffset } : {}
  try {
    return CronExpressionParser.parse(schedule.cron!, parseOptions)
      .next()
      .toDate()
  } catch {
    // Unparseable expression, or a non-IANA offset: retry without it
    try {
      return CronExpressionParser.parse(schedule.cron!).next().toDate()
    } catch {
      return null
    }
  }
}

export default defineEventHandler(async () => {
  const { schedules } = await schedulesRepository.getAll({
    name: null,
    limit: 500,
    offset: 0,
    status: 'active'
  })

  const now = Date.now()
  const upcoming = (schedules as ScheduleSelect[]).map(
    (schedule: ScheduleSelect) => {
      let nextRunAt: Date | null = null
      let exact = true
      if (schedule.time) {
        nextRunAt = new Date(schedule.time)
      } else if (schedule.cron) {
        nextRunAt = nextCronRun(schedule)
      } else if (schedule.interval) {
        // The scheduler keeps interval last-run state in memory,
        // so the next fire is only bounded, not exact.
        const seconds = parseIntervalSeconds(schedule.interval)
        nextRunAt = seconds === null ? null : new Date(now + seconds * 1000)
        exact = false
      }
      return {
        ...schedule,
        nextRunAt,
        exact,
        overdue: nextRunAt !== null && nextRunAt.getTime() < now
      }
    }
  )

  upcoming.sort((a, b) => {
    if (a.nextRunAt === null) {
      return 1
    }
    if (b.nextRunAt === null) {
      return -1
    }
    return a.nextRunAt.getTime() - b.nextRunAt.getTime()
  })

  return { upcoming }
})
