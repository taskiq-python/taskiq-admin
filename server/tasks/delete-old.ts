import { defineTask } from '#imports'
import { tasksRepository } from '~/server/repositories/tasks'
export default defineTask<{ ttlMinutes: number }, { result: string }>({
  meta: {
    name: 'delete-old',
    description: 'Delete old task information using the TTL parameter'
  },
  run({ payload, success }) {
    const TTL_MINUTES = process.env.TTL_MINUTES
    if (TTL_MINUTES) {
      console.log(
        `🚩 TTL_MINUTES is set to ${TTL_MINUTES}. Running delete query...`
      )
      const ttlMinutes = Number(TTL_MINUTES)
      tasksRepository
        .deleteOld({ ttlMinutes })
        .then(() => {
          console.log('✅ Old tasks deleted successfully')
        })
        .catch((err) => {
          console.error('❌ Failed to delete old tasks', err)
        })
      return { result: 'Success' }
    }
  }
})
