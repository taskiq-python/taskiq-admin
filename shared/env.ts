export type DBDriver = 'sqlite' | 'postgres'

const getRequiredEnv = (name: string) => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value
}

const getDbDriver = (): DBDriver => {
  const value = process.env.DB_DRIVER
  if (!value) {
    throw new Error('Environment variable DB_DRIVER is required')
  }
  if (value !== 'sqlite' && value !== 'postgres') {
    throw new Error(
      'Environment variable DB_DRIVER must be "sqlite" or "postgres"'
    )
  }
  return value
}

const dbDriver = getDbDriver()

export const envVariables = {
  dbDriver,
  dbFilePath:
    dbDriver === 'sqlite'
      ? getRequiredEnv('DB_FILE_PATH')
      : process.env.DB_FILE_PATH || '',
  dbUrl:
    dbDriver === 'postgres'
      ? getRequiredEnv('DB_URL')
      : process.env.DB_URL || '',
  backupFilePath:
    dbDriver === 'sqlite'
      ? getRequiredEnv('BACKUP_FILE_PATH')
      : process.env.BACKUP_FILE_PATH || '',
  taskiqAdminApiToken: getRequiredEnv('TASKIQ_ADMIN_API_TOKEN')
}
