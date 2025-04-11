import { drizzle } from 'drizzle-orm/better-sqlite3'

export const db = drizzle({
  connection: {
    source: process.env.DB_FILE_PATH!
  }
})
