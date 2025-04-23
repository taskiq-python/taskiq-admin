import { z } from 'zod'

export const taskQueuedRequestSchema = z.object({
  taskName: z.string(),
  queuedAt: z.coerce.date(),
  args: z.array(z.unknown()),
  worker: z.string().nullable(),
  kwargs: z.record(z.string(), z.unknown())
})

export const taskStartedRequestSchema = z.object({
  taskName: z.string(),
  startedAt: z.coerce.date(),
  args: z.array(z.unknown()),
  worker: z.string().nullable(),
  kwargs: z.record(z.string(), z.unknown())
})

export const taskExecutedRequestSchema = z.object({
  error: z.string().nullable(),
  executionTime: z.number(),
  finishedAt: z.coerce.date(),
  returnValue: z.record(z.string(), z.unknown()).nullable()
})

export const taskRouteParamsSchema = z.object({
  id: z.string()
})

export const getTasksQueryParamsSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().gte(0),
  offset: z.coerce.number().gte(0),
  state: z
    .enum(['queued', 'success', 'running', 'failure', 'abandoned'])
    .optional(),
  sortByRuntime: z.enum(['asc', 'desc']).optional(),
  sortByStartedAt: z.enum(['asc', 'desc']).optional(),
  sortByQueuedAt: z.enum(['asc', 'desc']).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional()
})
