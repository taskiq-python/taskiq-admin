import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'

const conn = new Database(process.env.DB_FILE_PATH!)

conn.pragma('synchronous = NORMAL')
conn.pragma('journal_size_limit = 6144000')

export const db = drizzle({
  client: conn
})
