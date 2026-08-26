import { defineTask } from '#imports'
import { tasksRepository } from '~~/server/repositories/tasks'
import { settingsRepository } from '~~/server/repositories/settings'
import { schedulesRepository } from '~~/server/repositories/schedules'
import { scheduleCommandsRepository } from '~~/server/repositories/schedule-commands'

export default defineTask<{ ttlMinutes?: number }, { result: string }>({
  meta: {
    name: 'delete-old',
    description: 'Delete old task information using the TTL parameter'
  },
  async run({ payload }: { payload: void }) {
    console.log('🗑️ delete-old task started')

    const settings = await settingsRepository.getAll()
    if (!settings.delete_old_ttl_minutes) {
      console.warn('⚠️ delete-old skipped: TTL not configured')
      return { result: 'Skipped: TTL not configured' }
    }

    console.log(
      `🚩 Running delete-old for TTL ${settings.delete_old_ttl_minutes} minute(s) ...`
    )
    try {
      await tasksRepository.deleteOld({
        ttlMinutes: settings.delete_old_ttl_minutes
      })
      await schedulesRepository.deleteOldRemoved({
        ttlMinutes: settings.delete_old_ttl_minutes
      })
      await scheduleCommandsRepository.deleteOldResolved({
        ttlMinutes: settings.delete_old_ttl_minutes
      })
      console.log('✅ Old tasks deleted successfully')
      return { result: 'Success' }
    } catch (error) {
      console.error('❌ Failed to delete old tasks', error)
      throw error
    }
  }
})
