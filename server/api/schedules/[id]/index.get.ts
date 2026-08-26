import { defineEventHandler, getValidatedRouterParams } from 'h3'
import { schedulesRepository } from '../../../repositories/schedules'
import { scheduleRouteParamsSchema } from '../../../../shared/schemas/schedules'

export default defineEventHandler(async (event) => {
  const params = await getValidatedRouterParams(
    event,
    scheduleRouteParamsSchema.parse
  )
  return await schedulesRepository.getById(params.id)
})
