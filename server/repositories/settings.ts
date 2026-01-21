import { eq } from 'drizzle-orm'
import { db } from '../../shared/db'
import { SettingKey } from '~~/shared/constants/settings'
import { taskiqAdminSettingsTable } from '../../shared/db/schema'
import { settingsSchema } from '~~/shared/schemas/settings'

class SettingsRepository {
  async getValue(key: SettingKey) {
    const rows = await db
      .select({ value: taskiqAdminSettingsTable.value })
      .from(taskiqAdminSettingsTable)
      .where(eq(taskiqAdminSettingsTable.key, key))

    if (rows.length === 0) {
      return undefined
    }

    return rows[0].value
  }

  async setValue(key: SettingKey, value: string | null) {
    return db
      .update(taskiqAdminSettingsTable)
      .set({
        value
      })
      .where(eq(taskiqAdminSettingsTable.key, key))
  }

  async setValues(values: Record<string, any | null>) {
    for (const [key, value] of Object.entries(values)) {
      await db
        .update(taskiqAdminSettingsTable)
        .set({
          value
        })
        .where(eq(taskiqAdminSettingsTable.key, key as SettingKey))
    }
  }

  async getAll() {
    const settings = await db.select().from(taskiqAdminSettingsTable)
    const object = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    return settingsSchema.parse(object)
  }
}

export const settingsRepository = new SettingsRepository()
