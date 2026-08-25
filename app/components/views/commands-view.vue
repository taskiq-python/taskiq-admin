<script setup lang="ts">
import { useAsyncData } from '#app'
import { useIntervalFn } from '@vueuse/core'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { RotateCcwIcon } from 'lucide-vue-next'
import { formatDate, formatTaskName, limitText } from '~/lib/utils'
import type { ScheduleCommandSelect } from '~~/shared/db/schema'
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

const page = ref(1)
const perPage = 20

const { data, refresh } = useAsyncData<{
  commands: ScheduleCommandSelect[]
  count: number
}>(
  'schedule-commands',
  () =>
    $fetch('/api/schedules/commands', {
      params: {
        limit: perPage,
        offset: (page.value - 1) * perPage
      }
    }),
  {
    watch: [page]
  }
)

useIntervalFn(() => {
  refresh()
}, 3000)

const handleRetry = async (command: ScheduleCommandSelect) => {
  try {
    await $fetch(`/api/schedules/commands/${command.id}/retry`, {
      method: 'POST'
    })
    toast.success('Retry requested')
    refresh()
  } catch (error: any) {
    toast.error('Failed to retry', {
      description: error?.data?.message || String(error)
    })
  }
}

const commandTask = (command: ScheduleCommandSelect) => {
  const taskName = command.payload?.task_name
  return taskName ? formatTaskName(String(taskName)) : '—'
}
</script>

<template>
  <div>
    <div class="flex justify-end mb-3">
      <p>
        <span class="text-foreground">Total</span>:
        {{ data?.count || 0 }}
      </p>
    </div>

    <Table>
      <TableCaption>Schedule Commands</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead> Type </TableHead>
          <TableHead> Task </TableHead>
          <TableHead> Schedule ID </TableHead>
          <TableHead> Source </TableHead>
          <TableHead> Status </TableHead>
          <TableHead> Error </TableHead>
          <TableHead> Created At </TableHead>
          <TableHead> Resolved At </TableHead>
          <TableHead class="text-center"> Actions </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="command in data?.commands"
          :key="command.id"
        >
          <TableCell class="font-medium">{{ command.type }}</TableCell>
          <TableCell>{{ commandTask(command) }}</TableCell>
          <TableCell>{{
            command.scheduleId ? limitText(command.scheduleId, 13) : '—'
          }}</TableCell>
          <TableCell>{{ command.sourceName }}</TableCell>
          <TableCell>
            <ScheduleCommandStatus :status="command.status" />
          </TableCell>
          <TableCell>{{ command.error || '—' }}</TableCell>
          <TableCell>{{ formatDate(String(command.createdAt)) }}</TableCell>
          <TableCell>{{
            command.resolvedAt ? formatDate(String(command.resolvedAt)) : '—'
          }}</TableCell>
          <TableCell>
            <div class="flex justify-center">
              <Button
                v-if="command.status === 'failed'"
                variant="outline"
                size="sm"
                class="cursor-pointer"
                title="Retry"
                @click="handleRetry(command)"
              >
                <RotateCcwIcon :size="14" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
