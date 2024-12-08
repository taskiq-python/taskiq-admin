import fs from "fs"
import { envVariables } from "~/server/env"

export default defineEventHandler(async (event) => {
  const stream = fs.createReadStream(envVariables.dbFilePath)
  setHeader(event, "Content-Type", "application/octet-stream")
  setHeader(event, "Content-Disposition", 'attachment; filename="database.db"')

  return sendStream(event, stream)
})
