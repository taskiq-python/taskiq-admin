<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
router.push({ path: '/tasks', query: { page: 1, perPage: 15 } })
</script>
<template></template>
