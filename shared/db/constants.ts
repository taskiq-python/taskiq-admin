export const DB_TABLE_NAMES = {
  tasks: 'taskiq_admin_tasks',
  settings: 'taskiq_admin_settings',
  schedules: 'taskiq_admin_schedules',
  scheduleCommands: 'taskiq_admin_schedule_commands',
  scheduleSources: 'taskiq_admin_schedule_sources',
  registeredTasks: 'taskiq_admin_registered_tasks'
} as const

export const DB_INDEX_NAMES = {
  tasksState: 'idx_taskiq_admin_tasks__state',
  tasksQueuedAt: 'idx_taskiq_admin_tasks__queued_at',
  tasksStartedAt: 'idx_taskiq_admin_tasks__started_at',
  tasksFinishedAt: 'idx_taskiq_admin_tasks__finished_at',
  tasksExecutionTime: 'idx_taskiq_admin_tasks__execution_time',
  tasksName: 'idx_taskiq_admin_tasks__name',
  tasksWorker: 'idx_taskiq_admin_tasks__worker',
  tasksScheduleId: 'idx_taskiq_admin_tasks__schedule_id',
  schedulesSourceName: 'idx_taskiq_admin_schedules__source_name',
  schedulesStatus: 'idx_taskiq_admin_schedules__status',
  schedulesTaskName: 'idx_taskiq_admin_schedules__task_name',
  schedulesLastSeenAt: 'idx_taskiq_admin_schedules__last_seen_at',
  scheduleCommandsSourceName: 'idx_taskiq_admin_schedule_commands__source_name',
  scheduleCommandsStatus: 'idx_taskiq_admin_schedule_commands__status',
  scheduleCommandsCreatedAt: 'idx_taskiq_admin_schedule_commands__created_at'
} as const
