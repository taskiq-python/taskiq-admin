export const SETTINGS = {
  delete_old_ttl_minutes: {
    key: 'delete_old_ttl_minutes',
    min: 1,
    max: 60 * 24 * 365, // 1 year
    defaultValue: null
  }
} as const

export type SettingKey = (typeof SETTINGS)[keyof typeof SETTINGS]['key']
