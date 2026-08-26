<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import RunsView from '~/components/views/runs-view.vue'
import ScheduledView from '~/components/views/scheduled-view.vue'
import UpcomingView from '~/components/views/upcoming-view.vue'
import CommandsView from '~/components/views/commands-view.vue'

const route = useRoute()
const router = useRouter()

const tabs = [
  { key: 'runs', label: 'Runs' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'audit', label: 'Audit' }
] as const

const currentView = computed(() => route.query.view?.toString() || 'runs')

const switchView = (view: string) => {
  router.push({
    path: '/tasks',
    query: view === 'runs' ? {} : { view }
  })
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="flex justify-between items-center mb-4">
      <div class="flex gap-1 border rounded-lg p-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          type="button"
          class="px-4 py-1.5 rounded-md text-sm cursor-pointer transition-colors"
          :class="
            currentView === tab.key
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="switchView(tab.key)"
        >
          {{ tab.label }}
        </button>
      </div>
      <RunTaskDialog />
    </div>

    <RunsView v-if="currentView === 'runs'" />
    <ScheduledView v-else-if="currentView === 'scheduled'" />
    <UpcomingView v-else-if="currentView === 'upcoming'" />
    <CommandsView v-else-if="currentView === 'audit'" />
  </div>
</template>
