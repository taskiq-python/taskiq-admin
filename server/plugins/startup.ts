import fs from 'fs/promises'
import { db } from '../../shared/db'
import { defineNitroPlugin } from '#imports'
import { taskiqAdminSettingsTable } from '~~/shared/db/schema'
import { SETTINGS } from '~~/shared/constants/settings'

export default defineNitroPlugin(async (nitroApp) => {
  console.log('Running DB initialization...')
  const sqlScript = await fs.readFile('dbschema.sql', 'utf-8')

  // executing the SQL script to create tables and indexes
  db.$client.exec(sqlScript)

  // seeding default settings
  db.insert(taskiqAdminSettingsTable)
    .values(
      Object.entries(SETTINGS).map(([_, value]) => ({
        key: value.key,
        value: value.defaultValue
      }))
    )
    .onConflictDoNothing()
    .run()

  console.log('DB initialization completed.')
})
