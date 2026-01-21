import { defineTask, runTask } from '#imports'
import { SETTINGS } from '~~/shared/constants/settings'
import { settingsRepository } from '~~/server/repositories/settings'

const settingsToTasksMap = {
  [SETTINGS.delete_old_ttl_minutes.key]: 'delete-old'
}

export default defineTask({
  meta: {
    name: 'settings-dispatcher',
    description:
      'Reads taskiq_admin_settings entries and dispatches maintenance tasks'
  },
  async run() {
    console.log('DISPATCHER: Starting settings-dispatcher task...')
    const settings = await settingsRepository.getAll()

    for (const [key, value] of Object.entries(settings)) {
      if (value === null) continue
      if (!(key in settingsToTasksMap)) continue

      const taskName =
        settingsToTasksMap[key as keyof typeof settingsToTasksMap]

      runTask(taskName, { key: value })
    }
    console.log('DISPATCHER: settings-dispatcher task completed.')
  }
})
