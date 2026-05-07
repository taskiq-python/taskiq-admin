import { envVariables } from '../env'
import * as sqliteSchema from './schema.sqlite'
import * as postgresSchema from './schema.postgres'

const schema =
  envVariables.dbDriver === 'sqlite' ? sqliteSchema : postgresSchema

export const tasksTable = schema.tasksTable
export const taskiqAdminSettingsTable = schema.taskiqAdminSettingsTable

export type TaskSelect = sqliteSchema.TaskSelect | postgresSchema.TaskSelect
export type TaskiqAdminSettings =
  | sqliteSchema.TaskiqAdminSettings
  | postgresSchema.TaskiqAdminSettings
