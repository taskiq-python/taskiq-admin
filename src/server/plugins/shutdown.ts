import { tasksRepository } from "~/server/repositories/tasks"

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("close", async () => {
    await tasksRepository.setAbandoned()
  })
})
