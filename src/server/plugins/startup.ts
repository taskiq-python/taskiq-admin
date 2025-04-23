import fs from 'fs/promises'
import { db } from '~/server/db'
import { defineNitroPlugin } from '#imports'

export default defineNitroPlugin(async (nitroApp) => {
  const sqlScript = await fs.readFile('dbschema.sql', 'utf-8')
  db.$client.exec(sqlScript)
})
