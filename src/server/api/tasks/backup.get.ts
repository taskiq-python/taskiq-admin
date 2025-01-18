import fs from "fs"
import { db } from "~/server/db"
import { envVariables } from "~/server/env"

export default defineEventHandler(async (event) => {
  await db.$client.backup(envVariables.backupFilePath)
  const stream = fs.createReadStream(envVariables.backupFilePath)

  setHeader(event, "Content-Type", "application/octet-stream")
  setHeader(event, "Content-Disposition", 'attachment; filename="backup.db"')

  return sendStream(event, stream)
})
