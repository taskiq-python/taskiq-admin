import fs from 'fs'
import { backupDatabase } from '../../../shared/db'
import { utcNow } from '../../../shared/utils'
import { envVariables } from '../../../shared/env'
import {
  createError,
  defineEventHandler,
  sendStream,
  setHeader
} from '#imports'

export default defineEventHandler(async (event) => {
  try {
    await backupDatabase(envVariables.backupFilePath)
  } catch (error) {
    throw createError({
      status: 400,
      statusMessage:
        error instanceof Error
          ? error.message
          : 'Could not create database backup'
    })
  }

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
