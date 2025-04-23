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
}
