<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { inject } from 'vue'
import { CopyIcon, PencilIcon, PlayIcon, Trash2Icon } from 'lucide-vue-next'
import { formatDate, formatTaskName, limitText } from '~/lib/utils'
import type { ScheduleSelect } from '~~/shared/db/schema'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'

const { data } = defineProps<{
  data?: {
    count: number
    schedules: ScheduleSelect[]
    pendingCommands: Record<string, string>
  }
}>()

const refreshHandler: (() => void) | undefined = inject('refreshHandler')

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value)
}

const handleCopy = (value: string) => {
  copyToClipboard(value)
  toast('Successfully copied', {
    description: 'The ID has been copied to your clipboard'
  })
}

const hasPendingCommand = (schedule: ScheduleSelect) => {
  return Boolean(data?.pendingCommands[schedule.id])
}

const formatSpec = (schedule: ScheduleSelect) => {
  if (schedule.cron) {
    const offset = schedule.cronOffset ? ` (${schedule.cronOffset})` : ''
    return `cron: ${schedule.cron}${offset}`
  }
  if (schedule.time) {
    return `once at ${formatDate(String(schedule.time))}`
  }
  if (schedule.interval) {
    return `every ${schedule.interval}s`
  }
  return '—'
}

const handleTrigger = async (schedule: ScheduleSelect) => {
  try {
    await $fetch(`/api/schedules/${schedule.id}/trigger`, { method: 'POST' })
    toast.success('Trigger requested', {
      description: 'The task will be sent by the scheduler shortly'
    })
    refreshHandler?.()
  } catch (error: any) {
    toast.error('Failed to trigger', {
      description: error?.data?.message || String(error)
    })
  }
}

const handleDelete = async (schedule: ScheduleSelect) => {
  if (!confirm(`Delete schedule of "${schedule.taskName}"?`)) {
    return
  }
  try {
    await $fetch(`/api/schedules/${schedule.id}`, { method: 'DELETE' })
    toast.success('Delete requested', {
      description: 'The schedule will be deleted by the scheduler shortly'
    })
    refreshHandler?.()
  } catch (error: any) {
    toast.error('Failed to delete', {
      description: error?.data?.message || String(error)
    })
  }
}

const editing = ref<ScheduleSelect | null>(null)
const editCron = ref('')
const editCronOffset = ref('')
const editTime = ref('')
const editInterval = ref('')

const openEdit = (schedule: ScheduleSelect) => {
  editing.value = schedule
  editCron.value = schedule.cron || ''
  editCronOffset.value = schedule.cronOffset || ''
  editTime.value = schedule.time
    ? new Date(schedule.time).toISOString().slice(0, 16)
    : ''
  editInterval.value = schedule.interval || ''
}

const submitEdit = async () => {
  if (!editing.value) {
    return
  }
  try {
    await $fetch(`/api/schedules/${editing.value.id}/reschedule`, {
      method: 'POST',
      body: {
        cron: editCron.value || null,
        cronOffset: editCronOffset.value || null,
        time: editTime.value ? new Date(editTime.value).toISOString() : null,
        interval: editInterval.value || null
      }
    })
    toast.success('Reschedule requested', {
      description: 'The schedule will be replaced by the scheduler shortly'
    })
    editing.value = null
    refreshHandler?.()
  } catch (error: any) {
    toast.error('Failed to reschedule', {
      description: error?.data?.message || String(error)
    })
  }
}
</script>

<template>
  <Table>
    <TableCaption>Schedules</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead> Task </TableHead>
        <TableHead> ID </TableHead>
        <TableHead> Source </TableHead>
        <TableHead> Schedule </TableHead>
        <TableHead> Args </TableHead>
        <TableHead> Kwargs </TableHead>
        <TableHead> Status </TableHead>
        <TableHead> Last Seen </TableHead>
        <TableHead class="text-center"> Actions </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="schedule in data?.schedules"
        :key="schedule.id"
      >
        <TableCell class="font-medium">
          {{ formatTaskName(schedule.taskName) }}
        </TableCell>
        <TableCell>
          <div class="flex justify-between items-center gap-1">
            <span>{{ limitText(schedule.id, 13) }}</span>
            <CopyIcon
              :size="15"
              @click="handleCopy(schedule.id)"
              class="cursor-pointer opacity-70 hover:opacity-100"
            />
          </div>
        </TableCell>
        <TableCell>
          <div class="flex items-center gap-2">
            <span>{{ schedule.sourceName }}</span>
            <span
              v-if="!schedule.editable"
              class="text-xs text-muted-foreground border rounded px-1"
            >
              read-only
            </span>
          </div>
        </TableCell>
        <TableCell>{{ formatSpec(schedule) }}</TableCell>
        <TableCell>{{
          limitText(JSON.stringify(schedule.args), 25)
        }}</TableCell>
        <TableCell>{{
          limitText(JSON.stringify(schedule.kwargs), 25)
        }}</TableCell>
        <TableCell>
          <div class="flex items-center gap-2">
            <ScheduleStatus :status="schedule.status" />
            <span
              v-if="data?.pendingCommands[schedule.id]"
              class="text-xs text-muted-foreground border rounded px-1"
            >
              {{ data?.pendingCommands[schedule.id] }} pending
            </span>
          </div>
        </TableCell>
        <TableCell>{{ formatDate(String(schedule.lastSeenAt)) }}</TableCell>
        <TableCell>
          <div class="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              class="cursor-pointer"
              title="Trigger now"
              :disabled="schedule.opaque || hasPendingCommand(schedule)"
              @click="handleTrigger(schedule)"
            >
              <PlayIcon :size="14" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="cursor-pointer"
              title="Reschedule"
              :disabled="
                !schedule.editable ||
                schedule.status !== 'active' ||
                schedule.opaque ||
                hasPendingCommand(schedule)
              "
              @click="openEdit(schedule)"
            >
              <PencilIcon :size="14" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="cursor-pointer"
              title="Delete"
              :disabled="
                !schedule.editable ||
                schedule.status !== 'active' ||
                hasPendingCommand(schedule)
              "
              @click="handleDelete(schedule)"
            >
              <Trash2Icon :size="14" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <Dialog
    :open="!!editing"
    @update:open="(open) => !open && (editing = null)"
  >
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Reschedule</DialogTitle>
        <DialogDescription>
          {{ editing ? formatTaskName(editing.taskName) : '' }} • a new
          schedule id is assigned on save
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="w-24">Cron</span>
          <Input
            v-model="editCron"
            placeholder="*/5 * * * *"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Cron offset</span>
          <Input
            v-model="editCronOffset"
            placeholder="Europe/Berlin"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Time</span>
          <Input
            v-model="editTime"
            type="datetime-local"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Interval (s)</span>
          <Input
            v-model="editInterval"
            placeholder="30"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          class="cursor-pointer"
          @click="submitEdit"
        >
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
