export const DB_TABLE_NAMES = {
  tasks: 'taskiq_admin_tasks',
  settings: 'taskiq_admin_settings'
} as const

export const DB_INDEX_NAMES = {
  tasksState: 'idx_taskiq_admin_tasks__state',
  tasksQueuedAt: 'idx_taskiq_admin_tasks__queued_at',
  tasksStartedAt: 'idx_taskiq_admin_tasks__started_at',
  tasksFinishedAt: 'idx_taskiq_admin_tasks__finished_at',
  tasksExecutionTime: 'idx_taskiq_admin_tasks__execution_time',
  tasksName: 'idx_taskiq_admin_tasks__name',
  tasksWorker: 'idx_taskiq_admin_tasks__worker'
} as const
