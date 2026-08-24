import Database from 'better-sqlite3'
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres'
import { mkdirSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { Pool } from 'pg'
import { envVariables } from '../env'
import { dbInitializationStatements } from './init'

const isInMemorySqlitePath = (sqlitePath: string) => {
  return sqlitePath === ':memory:' || sqlitePath.startsWith('file::memory:')
}

const ensureSqliteFilePath = (sqlitePath: string) => {
  if (isInMemorySqlitePath(sqlitePath) || sqlitePath.startsWith('file:')) {
    return sqlitePath
  }

  const resolvedPath = isAbsolute(sqlitePath)
    ? sqlitePath
    : resolve(process.cwd(), sqlitePath)
  mkdirSync(dirname(resolvedPath), { recursive: true })
  return resolvedPath
}

const sqliteClient =
  envVariables.dbDriver === 'sqlite'
    ? new Database(ensureSqliteFilePath(envVariables.dbFilePath))
    : null

const postgresClient =
  envVariables.dbDriver === 'postgres'
    ? new Pool({ connectionString: envVariables.dbUrl })
    : null

const sqliteDb = sqliteClient ? drizzleSqlite({ client: sqliteClient }) : null
const postgresDb = postgresClient
  ? drizzlePostgres({ client: postgresClient })
  : null

export const db: any =
  envVariables.dbDriver === 'sqlite' ? sqliteDb! : postgresDb!

const executeStatement = async (statement: string) => {
  if (envVariables.dbDriver === 'sqlite') {
    sqliteClient!.exec(statement)
    return
  }
  await postgresDb!.execute(sql.raw(statement))
}

export const initializeDatabase = async () => {
  for (const statement of dbInitializationStatements[envVariables.dbDriver]) {
    await executeStatement(statement)
  }
}

export const backupDatabase = async (backupFilePath: string) => {
  if (envVariables.dbDriver !== 'sqlite') {
    throw new Error('Database backup is supported only with sqlite driver')
  }
  await sqliteClient!.backup(ensureSqliteFilePath(backupFilePath))
}

export const resetDatabaseForTests = async () => {
  if (envVariables.dbDriver === 'sqlite') {
    sqliteClient!.exec('PRAGMA foreign_keys = OFF')
    sqliteClient!.exec('DROP TABLE IF EXISTS taskiq_admin_tasks')
    sqliteClient!.exec('DROP TABLE IF EXISTS taskiq_admin_settings')
    sqliteClient!.exec('DROP TABLE IF EXISTS taskiq_admin_schedules')
    sqliteClient!.exec('DROP TABLE IF EXISTS taskiq_admin_schedule_commands')
    sqliteClient!.exec('DROP TABLE IF EXISTS taskiq_admin_schedule_sources')
    sqliteClient!.exec('DROP TABLE IF EXISTS taskiq_admin_registered_tasks')
    await initializeDatabase()
    return
  }

  await postgresDb!.execute(sql`DROP TABLE IF EXISTS taskiq_admin_tasks`)
  await postgresDb!.execute(sql`DROP TABLE IF EXISTS taskiq_admin_settings`)
  await postgresDb!.execute(sql`DROP TABLE IF EXISTS taskiq_admin_schedules`)
  await postgresDb!.execute(
    sql`DROP TABLE IF EXISTS taskiq_admin_schedule_commands`
  )
  await postgresDb!.execute(
    sql`DROP TABLE IF EXISTS taskiq_admin_schedule_sources`
  )
  await postgresDb!.execute(
    sql`DROP TABLE IF EXISTS taskiq_admin_registered_tasks`
  )
  await initializeDatabase()
}
