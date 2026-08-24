import { defineEventHandler } from 'h3'
import { scheduleSourcesRepository } from '../../repositories/schedule-sources'

export default defineEventHandler(async () => {
  const sources = await scheduleSourcesRepository.getAll()
  return { sources }
})
