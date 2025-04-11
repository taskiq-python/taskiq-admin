<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '~/lib/utils'
import { Button } from '~/components/ui/button'
import { CopyIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const { data: task, error } = useFetch(`/api/tasks/${route.params.id}`)
const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value)
}

const handleCopy = (value: string) => {
  copyToClipboard(value)
  toast('Successfully copied', {
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
                <td>{{ task.returnValue }}</td>
              </tr>
              <tr>
                <th>Started At</th>
                <td>{{ formatDate(String(task.startedAt)) }}</td>
              </tr>
              <tr>
                <th>Finished At</th>
                <td>{{ formatDate(String(task.finishedAt)) }}</td>
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
