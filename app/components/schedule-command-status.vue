<script setup lang="ts">
import type { ScheduleCommandStatus } from '~~/shared/types'

const props = defineProps<{
  status: ScheduleCommandStatus
}>()

const defaultClasses =
  'text-background rounded-xl font-bold text-center py-0.5 px-2'
const bgColorMap = {
  pending: 'bg-blue-500 dark:text-foreground',
  leased: 'bg-yellow-500 dark:text-foreground',
  applied: 'bg-green-600 dark:text-foreground',
  failed: 'bg-red-500 dark:text-foreground'
}
</script>
<template>
  <span :class="defaultClasses + ' ' + bgColorMap[props.status]">
    {{ props.status }}
  </span>
</template>
