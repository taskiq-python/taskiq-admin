import * as z from 'zod'

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

export const getTasksQueryParamsSchema = z
  .object({
    search: z.string().optional(),
    limit: z.coerce.number().int().gte(1).lte(100),
    state: z
      .enum(['queued', 'success', 'running', 'failure', 'abandoned'])
      .optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    cursorQueuedAt: z.coerce.date().optional(),
    cursorId: z.string().optional(),
    direction: z.enum(['next', 'prev']).default('next')
  })
  .refine((q) => !!q.cursorQueuedAt === !!q.cursorId, {
    message: 'cursorQueuedAt and cursorId must be provided together'
  })
