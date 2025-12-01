import { db } from '~/server/db'
import { defineTask } from '#imports'

export default defineTask({
  meta: {
    name: 'db:vacuum',
    description: 'Perform VACUUM in the DB'
  },
  run({ payload, context }) {
    console.log('🚩 Running VACUUM')
    db.$client.prepare('VACUUM').run()
    console.log('✅ Done running VACUUM')
  }
})
