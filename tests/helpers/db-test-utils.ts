import fs from 'node:fs'
import { db } from '~~/shared/db'

export async function resetDatabase() {
  const schema = fs.readFileSync('dbschema.sql', 'utf8')
  db.$client.exec('PRAGMA foreign_keys = OFF;')
  db.$client.exec('DROP TABLE IF EXISTS tasks;') // в schema уже IF NOT EXISTS
  db.$client.exec(schema)
}
