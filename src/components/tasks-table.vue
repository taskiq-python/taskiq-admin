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
import { ArrowDownIcon, ArrowUpIcon, CopyIcon } from 'lucide-vue-next'
import { ArrowUpDownIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const { data } = defineProps<{
  data?: {
    count: number
    tasks: TaskSelect[]
  }
}>()

const queryParams:
  | {
      page: number
      perPage: number
      state: string | undefined
      search: string | undefined
      sortByRuntime: string | undefined
      sortByStartedAt: string | undefined
    }
  | undefined = inject('queryParams')

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value)
}

const handleCopy = (value: string) => {
  copyToClipboard(value)
  toast('Successfully copied', {
    description: 'The ID has been copied to your clipboard'
  })
}

const runtimeSortHandler = () => {
  if (queryParams?.sortByRuntime === 'asc') {
    sortHandler?.('runtime', 'desc')
  } else if (queryParams?.sortByRuntime === 'desc') {
    sortHandler?.('runtime', 'asc')
  } else {
    sortHandler?.('runtime', 'asc')
  }
}

const startedAtSortHandler = () => {
  if (queryParams?.sortByStartedAt === 'asc') {
    sortHandler?.('startedAt', 'desc')
  } else if (queryParams?.sortByStartedAt === 'desc') {
    sortHandler?.('startedAt', 'asc')
  } else {
    sortHandler?.('startedAt', 'asc')
  }
}

const sortHandler:
  | ((field: 'runtime' | 'startedAt', order: 'asc' | 'desc') => void)
  | undefined = inject('sortHandler')

const stateHandler:
  | ((state: 'running' | 'success' | 'failure' | 'abandoned') => void)
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
            <span>Started</span>
            <ArrowUpDownIcon
              v-if="queryParams?.sortByStartedAt === undefined"
              :size="15"
              class="cursor-pointer"
              @click="startedAtSortHandler"
            />
            <ArrowUpIcon
              v-if="queryParams?.sortByStartedAt === 'asc'"
              :size="15"
              class="cursor-pointer"
              @click="startedAtSortHandler"
            />
            <ArrowDownIcon
              v-if="queryParams?.sortByStartedAt === 'desc'"
              :size="15"
              class="cursor-pointer"
              @click="startedAtSortHandler"
            />
          </div>
        </TableHead>
        <TableHead> Finished </TableHead>
        <TableHead>
          <div class="flex justify-between items-center gap-2">
            <span>Runtime (s)</span>
            <ArrowUpDownIcon
              v-if="queryParams?.sortByRuntime === undefined"
              class="cursor-pointer"
              :size="15"
              @click="runtimeSortHandler"
            />
            <ArrowUpIcon
              v-if="queryParams?.sortByRuntime === 'asc'"
              :size="15"
              class="cursor-pointer"
              @click="runtimeSortHandler"
            />
            <ArrowDownIcon
              v-if="queryParams?.sortByRuntime === 'desc'"
              :size="15"
              class="cursor-pointer"
              @click="runtimeSortHandler"
            />
          </div>
        </TableHead>
        <TableHead> Worker </TableHead>
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
        <TableCell>{{ formatDate(String(task.startedAt)) }}</TableCell>
        <TableCell>
          {{ task.finishedAt ? formatDate(String(task.finishedAt)) : null }}
        </TableCell>
        <TableCell>{{ task.executionTime }}</TableCell>
        <TableCell>{{ task.worker }}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
