<script setup lang="ts">
import { toast } from 'vue-sonner'
import { formatDate } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { CopyIcon, LoaderCircleIcon } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useIntervalFn } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { useFetch } from '#imports'
import type { TaskSelect } from '~~/shared/db/schema'

const route = useRoute()
const router = useRouter()
const {
  data: task,
  error,
  refresh
} = useFetch<TaskSelect>(`/api/tasks/${route.params.id}`)
const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value)
}

useIntervalFn(() => {
  refresh()
}, 1500)

const handleCopy = (value: string) => {
  copyToClipboard(value)
  toast.success('Successfully copied', {
    description: 'The ID has been copied to your clipboard'
  })
}
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <Button
        class="cursor-pointer"
        @click="router.back()"
      >
        Back to Tasks
      </Button>
    </div>

    <div class="flex">
      <Card>
        <CardHeader>
          <CardTitle class="text-xl"> Task Details </CardTitle>
        </CardHeader>
        <CardContent>
          <table>
            <tbody v-if="task">
              <tr>
                <th>ID</th>
                <td class="flex items-center justify-start gap-2">
                  <span>{{ task.id }}</span>
                  <Button
                    @click="handleCopy(task.id)"
                    class="cursor-pointer"
                    variant="ghost"
                    ><CopyIcon
                  /></Button>
                </td>
              </tr>
              <tr>
                <th>Name</th>
                <td>{{ task.name }}</td>
              </tr>

              <tr>
                <th>State</th>
                <td>
                  <TaskState :state="task.state" />
                </td>
              </tr>
              <tr>
                <th>args</th>
                <td>{{ task.args }}</td>
              </tr>
              <tr>
                <th>kwargs</th>
                <td>{{ task.kwargs }}</td>
              </tr>
              <tr>
                <th>Return Value</th>
                <td>
                  {{
                    task.returnValue?.return_value
                      ? task.returnValue?.return_value
                      : 'null'
                  }}
                </td>
              </tr>
              <tr>
                <th>Queued At</th>
                <td>{{ formatDate(String(task.queuedAt), true) }}</td>
              </tr>
              <tr>
                <th>Started At</th>
                <td v-if="task.startedAt">
                  {{ formatDate(String(task.startedAt), true) }}
                </td>
                <td v-else>
                  <LoaderCircleIcon class="animate-spin" />
                </td>
              </tr>
              <tr>
                <th>Finished At</th>
                <td v-if="task.state === 'running'">
                  <LoaderCircleIcon class="animate-spin" />
                </td>
                <td v-else-if="task.state === 'abandoned'"></td>
                <td v-else>{{ formatDate(String(task.finishedAt), true) }}</td>
              </tr>
              <tr>
                <th>Error</th>
                <td>{{ task.error }}</td>
              </tr>
              <tr>
                <th>Worker</th>
                <td>{{ task.worker }}</td>
              </tr>
              <tr>
                <th>Runtime</th>
                <td>{{ task.executionTime }}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
th {
  text-align: left;
  border-right: 1px solid #ddd;
}
th,
td {
  padding: 8px;
  vertical-align: top;
  word-break: break-word;
  white-space: normal;
  overflow-wrap: break-word;
  max-width: 800px;
}
tr {
  border-bottom: 1px solid #ddd;
}
</style>
