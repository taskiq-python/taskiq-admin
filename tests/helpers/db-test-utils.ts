import { resetDatabaseForTests } from '../../shared/db'

export async function resetDatabase() {
  await resetDatabaseForTests()
}
