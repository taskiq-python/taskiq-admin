import { db, initializeDatabase } from '../../shared/db'
import { defineNitroPlugin } from '#imports'
import { taskiqAdminSettingsTable } from '~~/shared/db/schema'
import { SETTINGS } from '~~/shared/constants/settings'

export default defineNitroPlugin(async () => {
  console.log('Running DB initialization...')
  await initializeDatabase()

  // seeding default settings
  await db
    .insert(taskiqAdminSettingsTable)
    .values(
      Object.entries(SETTINGS).map(([_, value]) => ({
        key: value.key,
        value: value.defaultValue
      }))
    )
    .onConflictDoNothing()

  console.log('DB initialization completed.')
})
