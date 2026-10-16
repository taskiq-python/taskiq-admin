<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLocalStorage } from '@vueuse/core'

const perPageStorage = useLocalStorage<number>('tasks-per-page', 15)

const router = useRouter()
router.push({
  path: '/tasks',
  query: { perPage: perPageStorage.value }
})
</script>
<template></template>
