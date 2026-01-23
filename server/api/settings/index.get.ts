import { defineEventHandler } from '#imports'
import { settingsRepository } from '~~/server/repositories/settings'

export default defineEventHandler(async () => {
  return await settingsRepository.getAll()
})
