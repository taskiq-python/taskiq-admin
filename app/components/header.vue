<script setup lang="ts">
import { useRoute } from 'vue-router'
import Theme from '~/components/theme.vue'

const route = useRoute()
const navLinks = [
  { label: 'Tasks', to: '/tasks' },
  { label: 'Settings', to: '/settings' }
]

const isActiveRoute = (path: string) => {
  if (path === '/') {
    return route.path === '/'
  }

  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>
<template>
  <header class="h-14 text-foreground border-b-2 flex">
    <div class="container m-auto flex justify-between items-center">
      <div class="flex items-center gap-8">
        <NuxtLink
          class="no-underline"
          to="/"
          ><h3 class="text-2xl font-bold">Taskiq Admin</h3></NuxtLink
        >
        <nav class="flex gap-4 text-sm">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            class="tracking-wide"
            :class="[
              'pb-1 transition-colors no-underline',
              isActiveRoute(link.to)
                ? 'text-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground'
            ]"
            :to="link.to"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>
      <Theme />
    </div>
  </header>
</template>
