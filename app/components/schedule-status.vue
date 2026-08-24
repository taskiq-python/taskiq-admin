<script setup lang="ts">
import type { ScheduleStatus } from '~~/shared/types'

const props = defineProps<{
  status: ScheduleStatus
}>()

const defaultClasses =
  'text-background rounded-xl font-bold text-center py-0.5 px-2'
const bgColorMap = {
  active: 'bg-green-600 dark:text-foreground',
  removed: 'bg-foreground'
}
</script>
<template>
  <span :class="defaultClasses + ' ' + bgColorMap[props.status]">
    {{ props.status }}
  </span>
</template>
