import { defineEventHandler } from 'h3'
import { registeredTasksRepository } from '../../repositories/registered-tasks'

export default defineEventHandler(async () => {
  const tasks = await registeredTasksRepository.getAll()
  return { tasks }
})
