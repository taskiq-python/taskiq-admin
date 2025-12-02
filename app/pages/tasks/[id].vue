<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { formatDate } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { CopyIcon, LoaderCircleIcon } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useIntervalFn } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { useFetch } from '#imports'
import type { TaskSelect } from '~~/shared/db/schema'

const route = useRoute()
const router = useRouter()
const {
  data: task,
  error,
  refresh,
  pending
} = useFetch<TaskSelect>(`/api/tasks/${route.params.id}`)
const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value)
}

useIntervalFn(() => {
  refresh()
}, 2000)

const hasLoadedOnce = ref(Boolean(task.value))

watch(task, (current) => {
  if (current) {
    hasLoadedOnce.value = true
  }
})

const isLoading = computed(() => !hasLoadedOnce.value)

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
            <tbody>
              <tr>
                <th>ID</th>
                <td class="flex items-center justify-start gap-2">
                  <template v-if="!isLoading">
                    <span>{{ task?.id }}</span>
                    <Button
                      @click="task && handleCopy(task.id)"
                      class="cursor-pointer"
                      variant="ghost"
                    >
                      <CopyIcon />
                    </Button>
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-50"
                  />
                </td>
              </tr>
              <tr>
                <th>Name</th>
                <td>
                  <template v-if="!isLoading">
                    {{ task?.name }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-80"
                  />
                </td>
              </tr>

              <tr>
                <th>State</th>
                <td>
                  <template v-if="!isLoading && task">
                    <TaskState :state="task.state" />
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-24"
                  />
                </td>
              </tr>
              <tr>
                <th>args</th>
                <td>
                  <template v-if="!isLoading">
                    {{ task?.args }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-full max-w-2xl"
                  />
                </td>
              </tr>
              <tr>
                <th>kwargs</th>
                <td>
                  <template v-if="!isLoading">
                    {{ task?.kwargs }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-full max-w-2xl"
                  />
                </td>
              </tr>
              <tr>
                <th>Return Value</th>
                <td>
                  <template v-if="!isLoading">
                    {{
                      task?.returnValue?.return_value
                        ? task?.returnValue?.return_value
                        : 'null'
                    }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-80"
                  />
                </td>
              </tr>
              <tr>
                <th>Queued At</th>
                <td>
                  <template v-if="!isLoading">
                    {{ formatDate(String(task?.queuedAt), true) }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-40"
                  />
                </td>
              </tr>
              <tr>
                <th>Started At</th>
                <td>
                  <template v-if="isLoading">
                    <Skeleton class="h-4 w-40" />
                  </template>
                  <template v-else-if="task?.startedAt">
                    {{ formatDate(String(task.startedAt), true) }}
                  </template>
                  <template v-else>
                    <LoaderCircleIcon class="animate-spin" />
                  </template>
                </td>
              </tr>
              <tr>
                <th>Finished At</th>
                <td>
                  <template v-if="isLoading">
                    <Skeleton class="h-4 w-40" />
                  </template>
                  <template v-else-if="task?.state === 'running'">
                    <LoaderCircleIcon class="animate-spin" />
                  </template>
                  <template v-else-if="task?.state === 'abandoned'"></template>
                  <template v-else>
                    {{ formatDate(String(task?.finishedAt), true) }}
                  </template>
                </td>
              </tr>
              <tr>
                <th>Error</th>
                <td>
                  <template v-if="!isLoading">
                    {{ task?.error }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-full max-w-2xl"
                  />
                </td>
              </tr>
              <tr>
                <th>Worker</th>
                <td>
                  <template v-if="!isLoading">
                    {{ task?.worker }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-32"
                  />
                </td>
              </tr>
              <tr>
                <th>Runtime</th>
                <td>
                  <template v-if="!isLoading">
                    {{ task?.executionTime }}
                  </template>
                  <Skeleton
                    v-else
                    class="h-4 w-24"
                  />
                </td>
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
