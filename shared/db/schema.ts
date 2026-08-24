import { envVariables } from '../env'
import * as sqliteSchema from './schema.sqlite'
import * as postgresSchema from './schema.postgres'

const schema =
  envVariables.dbDriver === 'sqlite' ? sqliteSchema : postgresSchema

export const tasksTable = schema.tasksTable
export const taskiqAdminSettingsTable = schema.taskiqAdminSettingsTable
export const schedulesTable = schema.schedulesTable
export const scheduleCommandsTable = schema.scheduleCommandsTable
export const scheduleSourcesTable = schema.scheduleSourcesTable
export const registeredTasksTable = schema.registeredTasksTable

export type TaskSelect = sqliteSchema.TaskSelect | postgresSchema.TaskSelect
export type TaskiqAdminSettings =
  | sqliteSchema.TaskiqAdminSettings
  | postgresSchema.TaskiqAdminSettings
export type ScheduleSelect =
  | sqliteSchema.ScheduleSelect
  | postgresSchema.ScheduleSelect
export type ScheduleCommandSelect =
  | sqliteSchema.ScheduleCommandSelect
  | postgresSchema.ScheduleCommandSelect
export type ScheduleSourceSelect =
  | sqliteSchema.ScheduleSourceSelect
  | postgresSchema.ScheduleSourceSelect
export type RegisteredTaskSelect =
  | sqliteSchema.RegisteredTaskSelect
  | postgresSchema.RegisteredTaskSelect
