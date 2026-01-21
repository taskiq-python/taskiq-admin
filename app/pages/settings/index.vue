<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useAsyncData } from '#app'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { SETTINGS } from '~~/shared/constants/settings'
import type { SettingsSchema } from '~~/shared/schemas/settings'

const DELETE_OLD_TTL = SETTINGS.delete_old_ttl_minutes
const TTL_MINUTES_MIN = DELETE_OLD_TTL.min
const TTL_MINUTES_MAX = DELETE_OLD_TTL.max

const saving = ref(false)
const { data, pending, refresh } = useAsyncData<SettingsSchema>(
  'settings',
  () => $fetch('/api/settings')
)

const ttlInput = computed({
  get: () => data.value?.delete_old_ttl_minutes ?? '',
  set: (raw: string) => {
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) {
      data.value!.delete_old_ttl_minutes = null
    } else {
      data.value!.delete_old_ttl_minutes = parsed
    }
  }
})

const hasValidationError = ref(false)

async function handleSubmit() {
  try {
    saving.value = true
    const response = await $fetch('/api/settings', {
      method: 'PUT',
      body: data.value
    })
    saving.value = false
  } catch (error) {
    saving.value = false
    toast.error('Failed to save settings. Please try again.')
    return
  }

  toast.success('Settings saved successfully!')
  await refresh()
}
</script>

<template>
  <div class="container py-6">
    <Card class="max-w-xl">
      <form @submit.prevent="handleSubmit">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Control how long task metadata should be retained before the
            automated cleanup runs the delete-old job.
          </CardDescription>
        </CardHeader>
        <CardContent
          v-if="data"
          class="flex flex-col gap-4"
        >
          <label class="flex flex-col gap-2">
            <span class="text-sm font-medium text-foreground"
              >TTL (minutes)</span
            >
            <Input
              type="number"
              v-model="ttlInput"
              :disabled="pending"
              placeholder="Enter number of minutes"
            />
            <span class="text-xs text-muted-foreground">
              Minimum {{ TTL_MINUTES_MIN }} minute. Maximum
              {{ TTL_MINUTES_MAX }} minutes (~1 year). Leave this field empty to
              disable automatic cleanup.
            </span>
          </label>
          <p
            v-if="hasValidationError"
            class="text-xs text-red-500"
          >
            Value must be between {{ TTL_MINUTES_MIN }} and
            {{ TTL_MINUTES_MAX }}.
          </p>
        </CardContent>
        <CardFooter class="flex justify-end">
          <Button
            type="submit"
            :disabled="saving"
            class="cursor-pointer"
          >
            Save
          </Button>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>
