import { setup } from '@nuxt/test-utils'
import { resolve } from 'path'
import { registerSearchTests } from './helpers/search-suite'

await setup({
  rootDir: resolve(__dirname, '../..'),
  server: true,
  env: {
    NODE_ENV: 'test',
    TASKIQ_ADMIN_DB_DRIVER: 'sqlite',
    TASKIQ_ADMIN_DB_FILE_PATH: ':memory:',
    TASKIQ_ADMIN_BACKUP_FILE_PATH: ':memory:',
    TASKIQ_ADMIN_API_TOKEN: 'supersecret'
  }
})

registerSearchTests('sqlite')
