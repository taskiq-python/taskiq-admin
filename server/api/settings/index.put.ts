import { settingsSchema } from '~~/shared/schemas/settings'
import { defineEventHandler, readValidatedBody } from '#imports'
import { settingsRepository } from '~~/server/repositories/settings'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, settingsSchema.parse)
  await settingsRepository.setValues(body)

  return settingsRepository.getAll()
})
