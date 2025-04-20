import fs from 'fs'
import { db } from '~/server/db'
import { envVariables } from '~/server/env'
import { utcNow } from '~/server/utils'

export default defineEventHandler(async (event) => {
  // TODO(future): add check if mode is WAL from dotenv
  // await db.$client.pragma('wal_checkpoint')
  await db.$client.backup(envVariables.backupFilePath)
  const stream = fs.createReadStream(envVariables.backupFilePath)

  const now = utcNow()
  const formatted = now.format('YYYY-MM-DD HH-mm-ss')
  setHeader(event, 'Content-Type', 'application/octet-stream')
  setHeader(
    event,
    'Content-Disposition',
    `attachment; filename="${formatted}-backup.db"`
  )

  return sendStream(event, stream)
})
