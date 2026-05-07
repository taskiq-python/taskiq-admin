import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const dbDriver = process.env.TASKIQ_ADMIN_DB_DRIVER

if (!dbDriver) {
  throw new Error('Environment variable TASKIQ_ADMIN_DB_DRIVER is required')
}

if (dbDriver !== 'sqlite' && dbDriver !== 'postgres') {
  throw new Error(
    'Environment variable TASKIQ_ADMIN_DB_DRIVER must be "sqlite" or "postgres"'
  )
}

const dbUrl =
  dbDriver === 'sqlite'
    ? process.env.TASKIQ_ADMIN_DB_FILE_PATH
    : process.env.TASKIQ_ADMIN_DB_URL

if (!dbUrl) {
  throw new Error(
    dbDriver === 'sqlite'
      ? 'Environment variable TASKIQ_ADMIN_DB_FILE_PATH is required for sqlite driver'
      : 'Environment variable TASKIQ_ADMIN_DB_URL is required for postgres driver'
  )
}

export default defineConfig({
  out: './drizzle',
  schema:
    dbDriver === 'sqlite'
      ? './shared/db/schema.sqlite.ts'
      : './shared/db/schema.postgres.ts',
  dialect: dbDriver === 'sqlite' ? 'sqlite' : 'postgresql',
  dbCredentials: {
    url: dbUrl
  }
})
