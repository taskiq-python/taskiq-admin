<script setup lang="ts">
import { useAsyncData } from '#app'
import { computed, inject, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { PlayIcon } from 'lucide-vue-next'
import type {
  RegisteredTaskSelect,
  ScheduleSourceSelect
} from '~~/shared/db/schema'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '~/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem
} from '~/components/ui/select'

const {
  initialTaskName = '',
  initialArgs = undefined,
  initialKwargs = undefined,
  buttonLabel = 'Run Task',
  disabled = false
} = defineProps<{
  initialTaskName?: string
  initialArgs?: Array<any>
  initialKwargs?: Record<string, any>
  buttonLabel?: string
  disabled?: boolean
}>()

const refreshHandler: (() => void) | undefined = inject('refreshHandler')

const open = ref(false)
const taskName = ref('')
const sourceName = ref('')
const argsText = ref('[]')
const kwargsText = ref('{}')
const cron = ref('')
const cronOffset = ref('')
const time = ref('')
const interval = ref('')

watch(open, (isOpen) => {
  if (!isOpen) {
    return
  }
  if (initialTaskName) {
    taskName.value = initialTaskName
  }
  if (initialArgs !== undefined) {
    argsText.value = JSON.stringify(initialArgs)
  }
  if (initialKwargs !== undefined) {
    kwargsText.value = JSON.stringify(initialKwargs)
  }
})

const { data: tasksData } = useAsyncData<{ tasks: RegisteredTaskSelect[] }>(
  'registered-tasks',
  () => $fetch('/api/schedules/tasks'),
  { watch: [open] }
)

const { data: sourcesData } = useAsyncData<{
  sources: ScheduleSourceSelect[]
}>('schedule-sources-list', () => $fetch('/api/schedules/sources'), {
  watch: [open]
})

const selectedSource = computed(() =>
  sourcesData.value?.sources.find((source) => source.name === sourceName.value)
)

const parseArguments = () => {
  let args: unknown
  let kwargs: unknown
  try {
    args = JSON.parse(argsText.value || '[]')
    kwargs = JSON.parse(kwargsText.value || '{}')
  } catch (error) {
    toast.error('Invalid JSON in args or kwargs', {
      description: String(error)
    })
    return null
  }
  if (!Array.isArray(args)) {
    toast.error('Args must be a JSON array')
    return null
  }
  if (typeof kwargs !== 'object' || kwargs === null || Array.isArray(kwargs)) {
    toast.error('Kwargs must be a JSON object')
    return null
  }
  return { args, kwargs }
}

const validateTarget = () => {
  if (!taskName.value) {
    toast.error('Select a task')
    return false
  }
  if (!sourceName.value) {
    toast.error('Select a source')
    return false
  }
  return true
}

const handleRunNow = async () => {
  if (!validateTarget()) {
    return
  }
  const parsed = parseArguments()
  if (!parsed) {
    return
  }
  try {
    await $fetch('/api/schedules/run', {
      method: 'POST',
      body: {
        taskName: taskName.value,
        sourceName: sourceName.value,
        args: parsed.args,
        kwargs: parsed.kwargs
      }
    })
    toast.success('Run requested', {
      description: 'The task will be sent by the scheduler shortly'
    })
    open.value = false
    refreshHandler?.()
  } catch (error: any) {
    toast.error('Failed to run', {
      description: error?.data?.message || String(error)
    })
  }
}

const handleCreateSchedule = async () => {
  if (!validateTarget()) {
    return
  }
  if (!cron.value && !time.value && !interval.value) {
    toast.error('Either cron, time or interval must be present')
    return
  }
  const parsed = parseArguments()
  if (!parsed) {
    return
  }
  try {
    await $fetch('/api/schedules/create', {
      method: 'POST',
      body: {
        taskName: taskName.value,
        sourceName: sourceName.value,
        args: parsed.args,
        kwargs: parsed.kwargs,
        cron: cron.value || null,
        cronOffset: cronOffset.value || null,
        time: time.value ? new Date(time.value).toISOString() : null,
        interval: interval.value || null
      }
    })
    toast.success('Schedule requested', {
      description: 'The schedule will be created by the scheduler shortly'
    })
    open.value = false
    refreshHandler?.()
  } catch (error: any) {
    toast.error('Failed to create schedule', {
      description: error?.data?.message || String(error)
    })
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogTrigger as-child>
      <Button
        class="cursor-pointer"
        :disabled="disabled"
      >
        <PlayIcon :size="14" />
        {{ buttonLabel }}
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>Run a task</DialogTitle>
        <DialogDescription>
          Run any registered task right now, or create a new schedule for it
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="w-24">Task</span>
          <Select v-model="taskName">
            <SelectTrigger class="flex-1 cursor-pointer">
              <SelectValue placeholder="Select Task" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="task in tasksData?.tasks || []"
                :key="task.name"
                :value="task.name"
                class="cursor-pointer"
              >
                {{ task.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Source</span>
          <Select v-model="sourceName">
            <SelectTrigger class="flex-1 cursor-pointer">
              <SelectValue placeholder="Select Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="source in sourcesData?.sources || []"
                :key="source.name"
                :value="source.name"
                class="cursor-pointer"
              >
                {{ source.name }}
                {{ source.editable ? '' : '(read-only)' }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Args</span>
          <Input
            v-model="argsText"
            placeholder="[]"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Kwargs</span>
          <Input
            v-model="kwargsText"
            placeholder="{}"
          />
        </div>
        <hr />
        <p class="text-sm text-muted-foreground">
          Fill one of the fields below to create a schedule instead of a
          one-time run (the source must be editable)
        </p>
        <div class="flex items-center gap-2">
          <span class="w-24">Cron</span>
          <Input
            v-model="cron"
            placeholder="*/5 * * * *"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Cron offset</span>
          <Input
            v-model="cronOffset"
            placeholder="Europe/Berlin"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Time</span>
          <Input
            v-model="time"
            type="datetime-local"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="w-24">Interval (s)</span>
          <Input
            v-model="interval"
            placeholder="30"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          class="cursor-pointer"
          :disabled="!cron && !time && !interval"
          :title="
            selectedSource && !selectedSource.editable
              ? 'The selected source is read-only'
              : 'Create a schedule'
          "
          @click="handleCreateSchedule"
        >
          Create Schedule
        </Button>
        <Button
          class="cursor-pointer"
          @click="handleRunNow"
        >
          Run Now
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
