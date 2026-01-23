import * as z from 'zod'
import { SETTINGS } from '../constants/settings'

export const settingsSchema = z.object({
  [SETTINGS.delete_old_ttl_minutes.key]: z.coerce
    .number()
    .int()
    .min(SETTINGS.delete_old_ttl_minutes.min)
    .max(SETTINGS.delete_old_ttl_minutes.max)
    .nullable()
})

export type SettingsSchema = z.infer<typeof settingsSchema>
