<script setup lang="ts">
import {
  formatTaskName,
  limitText,
  formatReturnValue,
  formatDate
} from '~/lib/utils'
import type { TaskSelect } from '~~/shared/db/schema'
import {
  Table,
  TableBody,
  TableCaption,
  TableRow,
  TableCell,
  TableHead,
  TableHeader
} from '~/components/ui/table'
import { CopyIcon, Maximize2Icon } from 'lucide-vue-next'
import SortableArrow from '~/components/sortable-arrow.vue'
import { toast } from 'vue-sonner'
import type { QueryParams } from '~~/shared/types'
import { inject } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'

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
        <TableHead class="text-center"> Error </TableHead>
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
              limitText(task.id, 13)
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
        <TableCell>{{ limitText(JSON.stringify(task.args), 25) }}</TableCell>
        <TableCell>{{ limitText(JSON.stringify(task.kwargs), 25) }}</TableCell>
        <TableCell>{{ limitText(formatReturnValue(task), 10) }}</TableCell>
        <TableCell class="text-center">
          <Dialog v-if="task.state === 'failure' && task.error">
            <DialogTrigger as-child>
              <button
                type="button"
                class="inline-flex items-center rounded border border-border p-1 text-muted-foreground transition hover:text-foreground cursor-pointer"
                aria-label="View full error"
              >
                <Maximize2Icon :size="12" />
                <span class="sr-only">View error details</span>
              </button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Error details</DialogTitle>
                <DialogDescription>
                  {{ formatTaskName(task.name) }} •
                  <NuxtLink
                    class="text-primary underline"
                    :to="{ name: 'tasks-id', params: { id: task.id } }"
                    >{{ task.id }}</NuxtLink
                  >
                </DialogDescription>
              </DialogHeader>
              <pre
                class="max-h-[60vh] overflow-auto rounded bg-muted p-4 text-left text-sm leading-relaxed"
                >{{ task.error.trim() }}</pre
              >
            </DialogContent>
          </Dialog>
          <span
            v-else
            class="text-muted-foreground"
          >
            —
          </span>
        </TableCell>
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
