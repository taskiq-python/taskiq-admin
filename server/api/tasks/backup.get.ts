import fs from 'fs'
import { db } from '../../../shared/db'
import { utcNow } from '../../../shared/utils'
import { envVariables } from '../../../shared/env'
import { defineEventHandler, sendStream, setHeader } from '#imports'

export default defineEventHandler(async (event) => {
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
