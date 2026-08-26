export type QueryParams = {
  page: number
  perPage: number
  state?: string
  search?: string
  sortByRuntime?: string
  sortByStartedAt?: string
  sortByQueuedAt?: string
  startDate?: string
  endDate?: string
}

export const StateEnum = {
  queued: 'queued',
  running: 'running',
  success: 'success',
  failure: 'failure',
  abandoned: 'abandoned'
} as const
export const StateEnumValues = Object.values(StateEnum)
export type TaskState = (typeof StateEnum)[keyof typeof StateEnum]

export type TaskCreate = {
  id: string
  name: string
  args: Array<any>
  queuedAt: Date
  startedAt: Date | null
  worker: string | null
  finishedAt: Date | null
  kwargs: Record<string, any>
  executionTime: number | null
  returnValue: { return_value: any } | null
  state: TaskState
  scheduleId?: string | null
}

export const ScheduleStatusEnum = {
  active: 'active',
  removed: 'removed'
} as const
export const ScheduleStatusEnumValues = Object.values(ScheduleStatusEnum)
export type ScheduleStatus =
  (typeof ScheduleStatusEnum)[keyof typeof ScheduleStatusEnum]

export const ScheduleCommandTypeEnum = {
  delete: 'delete',
  add: 'add',
  trigger: 'trigger'
} as const
export const ScheduleCommandTypeEnumValues = Object.values(
  ScheduleCommandTypeEnum
)
export type ScheduleCommandType =
  (typeof ScheduleCommandTypeEnum)[keyof typeof ScheduleCommandTypeEnum]

export const ScheduleCommandStatusEnum = {
  pending: 'pending',
  leased: 'leased',
  applied: 'applied',
  failed: 'failed'
} as const
export const ScheduleCommandStatusEnumValues = Object.values(
  ScheduleCommandStatusEnum
)
export type ScheduleCommandStatus =
  (typeof ScheduleCommandStatusEnum)[keyof typeof ScheduleCommandStatusEnum]

export type ScheduleCreate = {
  id: string
  sourceName: string
  taskName: string
  cron: string | null
  cronOffset: string | null
  time: Date | null
  interval: string | null
  args: Array<any>
  kwargs: Record<string, any>
  labels: Record<string, any>
  editable: boolean
  opaque: boolean
  status: ScheduleStatus
  firstSeenAt: Date
  lastSeenAt: Date
}

export type ScheduleCommandCreate = {
  id: string
  scheduleId: string | null
  sourceName: string
  type: ScheduleCommandType
  payload: Record<string, any>
  status: ScheduleCommandStatus
  error: string | null
  createdAt: Date
  leasedAt: Date | null
  resolvedAt: Date | null
}

export type ScheduleQueryParams = {
  page: number
  perPage: number
  sourceName?: string
  status?: string
  search?: string
}

export type ScheduleSourceCreate = {
  name: string
  editable: boolean
  lastSeenAt: Date
}

export type RegisteredTaskCreate = {
  name: string
  labels: Record<string, any>
  lastSeenAt: Date
}
