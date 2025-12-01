import { defineNitroPlugin } from '#imports'
import { tasksRepository } from '../repositories/tasks'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    await tasksRepository.setAbandoned()
  })
})
