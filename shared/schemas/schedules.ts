import * as z from 'zod'

const nullableDate = z.union([z.null(), z.coerce.date()])

export const snapshotScheduleSchema = z.object({
  scheduleId: z.string(),
  taskName: z.string(),
  cron: z.string().nullable(),
  cronOffset: z.string().nullable(),
  time: nullableDate,
  interval: z.union([z.string(), z.number()]).nullable(),
  args: z.array(z.unknown()),
  kwargs: z.record(z.string(), z.unknown()),
  labels: z.record(z.string(), z.unknown()),
  opaque: z.boolean().optional()
})

export const scheduleSnapshotRequestSchema = z.object({
  sourceName: z.string(),
  editable: z.boolean(),
  scannedAt: z.coerce.date(),
  schedules: z.array(snapshotScheduleSchema)
})

export const scheduleCommandsPollRequestSchema = z.object({
  sourceName: z.string()
})

export const scheduleCommandsAckRequestSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      status: z.enum(['applied', 'failed']),
      error: z.string().nullable()
    })
  )
})

export const scheduleRouteParamsSchema = z.object({
  id: z.string()
})

export const getSchedulesQueryParamsSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().gte(0),
  offset: z.coerce.number().gte(0),
  sourceName: z.string().optional(),
  status: z.enum(['active', 'removed']).optional(),
  kind: z.enum(['recurring', 'oneoff']).optional(),
  scheduleId: z.string().optional()
})

export const rescheduleRequestSchema = z.object({
  cron: z.string().nullable().optional(),
  cronOffset: z.string().nullable().optional(),
  time: nullableDate.optional(),
  interval: z.union([z.string(), z.number()]).nullable().optional(),
  args: z.array(z.unknown()).optional(),
  kwargs: z.record(z.string(), z.unknown()).optional()
})

export const createScheduleRequestSchema = z
  .object({
    sourceName: z.string(),
    taskName: z.string(),
    cron: z.string().nullable().optional(),
    cronOffset: z.string().nullable().optional(),
    time: nullableDate.optional(),
    interval: z.union([z.string(), z.number()]).nullable().optional(),
    args: z.array(z.unknown()).default([]),
    kwargs: z.record(z.string(), z.unknown()).default({}),
    labels: z.record(z.string(), z.unknown()).default({})
  })
  .refine((data) => data.cron || data.time || data.interval, {
    message: 'Either cron, time or interval must be present'
  })

export const getScheduleCommandsQueryParamsSchema = z.object({
  limit: z.coerce.number().gte(0),
  offset: z.coerce.number().gte(0),
  sourceName: z.string().optional(),
  scheduleId: z.string().optional(),
  status: z.enum(['pending', 'leased', 'applied', 'failed']).optional()
})

export const registeredTasksSnapshotRequestSchema = z.object({
  tasks: z.array(
    z.object({
      name: z.string(),
      labels: z.record(z.string(), z.unknown())
    })
  )
})

export const runTaskRequestSchema = z.object({
  taskName: z.string(),
  sourceName: z.string(),
  args: z.array(z.unknown()).default([]),
  kwargs: z.record(z.string(), z.unknown()).default({}),
  labels: z.record(z.string(), z.unknown()).default({}),
  taskId: z.string().optional()
})
