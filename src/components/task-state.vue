<script setup lang="ts">
const props = defineProps<{
  state: 'success' | 'running' | 'failure' | 'abandoned'
}>()

const defaultClasses =
  'text-background rounded-xl font-bold text-center py-0.5 px-2 cursor-pointer'
const bgColorMap = {
  failure: 'bg-red-500 dark:text-foreground',
  success: 'bg-green-600 dark:text-foreground',
  running: 'bg-yellow-500 dark:text-foreground',
  abandoned: 'bg-foreground'
}
</script>
<template>
  <span :class="defaultClasses + ' ' + bgColorMap[props.state]">
    {{ props.state }}
  </span>
</template>
