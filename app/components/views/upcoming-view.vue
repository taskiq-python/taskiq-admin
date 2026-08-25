<script setup lang="ts">
import { useAsyncData } from '#app'
import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { PlayIcon, Trash2Icon } from 'lucide-vue-next'
import { formatDate, formatTaskName, limitText } from '~/lib/utils'
import type { ScheduleSelect } from '~~/shared/db/schema'
import { Button } from '~/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableRow,
  TableCell,
  TableHead,
  TableHeader
} from '~/components/ui/table'

type UpcomingItem = ScheduleSelect & {
  nextRunAt: string | null
  exact: boolean
  overdue: boolean
}

const { data, refresh } = useAsyncData<{ upcoming: UpcomingItem[] }>(
  'upcoming-schedules',
  () => $fetch('/api/schedules/upcoming')
)

useIntervalFn(() => {
  refresh()
}, 3000)

const page = ref(1)
const perPage = 15

const totalPages = computed(() =>
  Math.max(1, Math.ceil((data.value?.upcoming.length || 0) / perPage))
)

const pageItems = computed(() =>
  (data.value?.upcoming || []).slice((page.value - 1) * perPage, page.value * perPage)
)

const handleNext = () => {
  if (page.value < totalPages.value) {
    page.value++
  }
}

const handlePrev = () => {
  if (page.value > 1) {
    page.value--
  }
}

const relativeTime = (value: string) => {
  const deltaSeconds = Math.round(
    (new Date(value).getTime() - Date.now()) / 1000
  )
  const suffix = deltaSeconds < 0 ? ' ago' : ''
  const prefix = deltaSeconds < 0 ? '' : 'in '
  const seconds = Math.abs(deltaSeconds)
  if (seconds < 60) {
    return `${prefix}${seconds}s${suffix}`
  }
  if (seconds < 3600) {
    return `${prefix}${Math.round(seconds / 60)}m${suffix}`
  }
  if (seconds < 86400) {
    return `${prefix}${Math.round(seconds / 3600)}h${suffix}`
  }
  return `${prefix}${Math.round(seconds / 86400)}d${suffix}`
}

const formatSpec = (item: UpcomingItem) => {
  if (item.cron) {
    const offset = item.cronOffset ? ` (${item.cronOffset})` : ''
    return `cron: ${item.cron}${offset}`
  }
  if (item.time) {
    return 'one-off'
  }
  if (item.interval) {
    return `every ${item.interval}s`
  }
  return '—'
}

const handleTrigger = async (item: UpcomingItem) => {
  try {
    await $fetch(`/api/schedules/${item.id}/trigger`, { method: 'POST' })
    toast.success('Trigger requested', {
      description: 'The task will be sent by the scheduler shortly'
    })
    refresh()
  } catch (error: any) {
    toast.error('Failed to trigger', {
      description: error?.data?.message || String(error)
    })
  }
}

const handleDelete = async (item: UpcomingItem) => {
  if (!confirm(`Delete schedule of "${item.taskName}"?`)) {
    return
  }
  try {
    await $fetch(`/api/schedules/${item.id}`, { method: 'DELETE' })
    toast.success('Delete requested', {
      description: 'The schedule will be deleted by the scheduler shortly'
    })
    refresh()
  } catch (error: any) {
    toast.error('Failed to delete', {
      description: error?.data?.message || String(error)
    })
  }
}
</script>

<template>
  <div>
    <Table>
      <TableCaption>Upcoming Runs</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead> Task </TableHead>
          <TableHead> Source </TableHead>
          <TableHead> When </TableHead>
          <TableHead> Schedule </TableHead>
          <TableHead> Args </TableHead>
          <TableHead> Kwargs </TableHead>
          <TableHead class="text-center"> Actions </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="item in pageItems"
          :key="item.id"
        >
          <TableCell class="font-medium">
            {{ formatTaskName(item.taskName) }}
          </TableCell>
          <TableCell>
            <div class="flex items-center gap-2">
              <span>{{ item.sourceName }}</span>
              <span
                v-if="!item.editable"
                class="text-xs text-muted-foreground border rounded px-1"
              >
                read-only
              </span>
            </div>
          </TableCell>
          <TableCell>
            <div
              v-if="item.nextRunAt"
              class="flex items-center gap-2"
            >
              <span>{{ formatDate(String(item.nextRunAt)) }}</span>
              <span class="text-muted-foreground">
                {{ relativeTime(item.nextRunAt) }}
              </span>
              <span
                v-if="!item.exact"
                class="text-xs text-muted-foreground border rounded px-1"
                title="The exact time of interval schedules is kept by the scheduler, this is an upper bound"
              >
                approximate
              </span>
              <span
                v-if="item.overdue"
                class="text-xs text-red-500 border border-red-500 rounded px-1"
              >
                overdue
              </span>
            </div>
            <span
              v-else
              class="text-muted-foreground"
            >
              —
            </span>
          </TableCell>
          <TableCell>{{ formatSpec(item) }}</TableCell>
          <TableCell>{{ limitText(JSON.stringify(item.args), 25) }}</TableCell>
          <TableCell>{{
            limitText(JSON.stringify(item.kwargs), 25)
          }}</TableCell>
          <TableCell>
            <div class="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                class="cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed"
                title="Trigger now"
                :disabled="item.opaque"
                @click="handleTrigger(item)"
              >
                <PlayIcon :size="14" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="cursor-pointer disabled:pointer-events-auto disabled:cursor-not-allowed"
                :title="
                  item.editable
                    ? 'Delete'
                    : 'Defined in code (read-only source), remove its schedule label instead'
                "
                :disabled="!item.editable"
                @click="handleDelete(item)"
              >
                <Trash2Icon :size="14" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

    <div class="flex mt-3 justify-between">
      <div>
        <p>
          <span class="text-foreground">Total</span>:
          {{ data?.upcoming.length || 0 }}
        </p>
      </div>
      <nav class="flex">
        <Button
          @click="handlePrev"
          :class="{ disabled: page === 1 }"
          class="page-link cursor-pointer"
        >
          Previous
        </Button>
        <div class="flex justify-center items-center px-2">
          <span>{{ page }} / {{ totalPages }}</span>
        </div>
        <Button
          @click="handleNext"
          class="page-link cursor-pointer"
          :class="{ disabled: page === totalPages }"
        >
          Next
        </Button>
      </nav>
    </div>
  </div>
</template>
