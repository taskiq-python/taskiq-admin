<script setup lang="ts">
import {
  formatTaskName,
  limitText,
  formatReturnValue,
  formatDate
} from '~/lib/utils'
import type { TaskSelect } from '~/server/db/schema'
import {
  Table,
  TableBody,
  TableCaption,
  TableRow,
  TableCell,
  TableHead,
  TableHeader
} from '~/components/ui/table'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CopyIcon,
  ArrowUpDownIcon
} from 'lucide-vue-next'
import SortableArrow from '~/components/sortable-arrow.vue'
import { toast } from 'vue-sonner'
import type { QueryParams } from '~/types'
import { inject } from 'vue'

const { data } = defineProps<{
  data?: {
    count: number
    tasks: TaskSelect[]
  }
}>()

const queryParams: QueryParams | undefined = inject('queryParams')

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value)
}

const handleCopy = (value: string) => {
  copyToClipboard(value)
  toast('Successfully copied', {
    description: 'The ID has been copied to your clipboard'
  })
}

const clickSortHandler = (name: 'StartedAt' | 'Runtime' | 'QueuedAt') => {
  const param = queryParams?.[`sortBy${name}`]
  if (param === 'asc') {
    sortHandler?.(name, 'desc')
  } else if (param) {
    sortHandler?.(name, 'asc')
  } else {
    sortHandler?.(name, 'asc')
  }
}

const sortHandler:
  | ((
      field: 'Runtime' | 'StartedAt' | 'QueuedAt',
      order: 'asc' | 'desc'
    ) => void)
  | undefined = inject('sortHandler')

const stateHandler:
  | ((
      state: 'queued' | 'running' | 'success' | 'failure' | 'abandoned'
    ) => void)
  | undefined = inject('stateHandler')

const searchHandler: ((value: string) => void) | undefined =
  inject('searchHandler')
</script>

<template>
  <Table>
    <TableCaption>Tasks</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead> Name </TableHead>
        <TableHead> ID</TableHead>
        <TableHead> State</TableHead>
        <TableHead> Args </TableHead>
        <TableHead> Kwargs </TableHead>
        <TableHead> Result </TableHead>
        <TableHead>
          <div class="flex justify-between items-center gap-2">
            <span>Queued At</span>
            <SortableArrow
              :order="queryParams?.sortByQueuedAt"
              :clickHandler="() => clickSortHandler('QueuedAt')"
            />
          </div>
        </TableHead>
        <TableHead>
          <div class="flex justify-between items-center gap-2">
            <span>Started At</span>
            <SortableArrow
              :order="queryParams?.sortByStartedAt"
              :clickHandler="() => clickSortHandler('StartedAt')"
            />
          </div>
        </TableHead>
        <TableHead>Finished At</TableHead>
        <TableHead>
          <div class="flex justify-between items-center gap-2">
            <span>Runtime (s)</span>
            <SortableArrow
              :order="queryParams?.sortByRuntime"
              :clickHandler="() => clickSortHandler('Runtime')"
            />
          </div>
        </TableHead>
        <TableHead> Broker </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="task in data?.tasks"
        :key="task.id"
      >
        <TableCell
          class="font-medium cursor-pointer"
          @click="searchHandler?.(formatTaskName(task.name))"
        >
          {{ formatTaskName(task.name) }}
        </TableCell>
        <TableCell class="underline">
          <div class="flex justify-between items-center gap-1">
            <NuxtLink :to="{ name: 'tasks-id', params: { id: task.id } }">{{
              limitText(task.id, 15)
            }}</NuxtLink>
            <CopyIcon
              :size="15"
              @click="handleCopy(task.id)"
              class="cursor-pointer opacity-70 hover:opacity-100"
            />
          </div>
        </TableCell>
        <TableCell class="text-center">
          <TaskState
            @click="stateHandler?.(task.state)"
            :state="task.state"
          />
        </TableCell>
        <TableCell>{{ task.args }}</TableCell>
        <TableCell>{{ limitText(JSON.stringify(task.kwargs), 30) }}</TableCell>
        <TableCell>{{ limitText(formatReturnValue(task), 10) }}</TableCell>
        <TableCell>{{ formatDate(String(task.queuedAt)) }}</TableCell>
        <TableCell>{{
          task.startedAt ? formatDate(String(task.startedAt)) : null
        }}</TableCell>
        <TableCell>
          {{ task.finishedAt ? formatDate(String(task.finishedAt)) : null }}
        </TableCell>
        <TableCell>{{ task.executionTime }}</TableCell>
        <TableCell>{{ task.worker }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
