// Runs the shared search suite against postgres.
// Skipped unless TASKIQ_ADMIN_TEST_DB_URL points at a disposable database,
// because the suite truncates the tasks table.
import { setup } from '@nuxt/test-utils'
import { resolve } from 'path'
import { describe, test } from 'vitest'
import { registerSearchTests } from './helpers/search-suite'

const dbUrl = process.env.TASKIQ_ADMIN_TEST_DB_URL

if (!dbUrl) {
  describe.skip('task name search (postgres)', () => {
    test('needs TASKIQ_ADMIN_TEST_DB_URL', () => {})
  })
} else {
  process.env.TASKIQ_ADMIN_DB_DRIVER = 'postgres'
  process.env.TASKIQ_ADMIN_DB_URL = dbUrl
  process.env.TASKIQ_ADMIN_API_TOKEN = 'supersecret'

  const { resetDatabaseForTests } = await import('../shared/db')

  await setup({
    rootDir: resolve(__dirname, '../..'),
    server: true,
    env: {
      NODE_ENV: 'test',
      TASKIQ_ADMIN_DB_DRIVER: 'postgres',
      TASKIQ_ADMIN_DB_URL: dbUrl,
      TASKIQ_ADMIN_API_TOKEN: 'supersecret'
    }
  })

  await resetDatabaseForTests()

  registerSearchTests('postgres')
}
