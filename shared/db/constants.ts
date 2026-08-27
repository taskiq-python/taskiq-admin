export const DB_TABLE_NAMES = {
  tasks: 'taskiq_admin_tasks',
  settings: 'taskiq_admin_settings',
  tasksFts: 'taskiq_admin_tasks_fts'
} as const

export const DB_INDEX_NAMES = {
  tasksState: 'idx_taskiq_admin_tasks__state',
  tasksQueuedAt: 'idx_taskiq_admin_tasks__queued_at',
  tasksStartedAt: 'idx_taskiq_admin_tasks__started_at',
  tasksFinishedAt: 'idx_taskiq_admin_tasks__finished_at',
  tasksExecutionTime: 'idx_taskiq_admin_tasks__execution_time',
  tasksName: 'idx_taskiq_admin_tasks__name',
  tasksWorker: 'idx_taskiq_admin_tasks__worker',
  tasksStateQueuedAt: 'idx_taskiq_admin_tasks__state_queued_at',
  tasksStateStartedAt: 'idx_taskiq_admin_tasks__state_started_at',
  tasksStateExecutionTime: 'idx_taskiq_admin_tasks__state_execution_time',
  tasksNameFts: 'idx_taskiq_admin_tasks__name_fts',
  tasksNameTrgm: 'idx_taskiq_admin_tasks__name_trgm'
} as const

export const DB_TRIGGER_NAMES = {
  tasksFtsInsert: 'trg_taskiq_admin_tasks_fts_ai',
  tasksFtsDelete: 'trg_taskiq_admin_tasks_fts_ad',
  tasksFtsUpdate: 'trg_taskiq_admin_tasks_fts_au'
} as const
