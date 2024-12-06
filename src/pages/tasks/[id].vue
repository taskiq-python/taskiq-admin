<script setup lang="ts">
const route = useRoute()
const { data: task, error } = useFetch(`/api/tasks/${route.params.id}`)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Task Details</h2>
      <NuxtLink to="/tasks"> Back to Tasks </NuxtLink>
    </div>

    <div class="card">
      <div class="card-body">
        <table class="table">
          <tbody v-if="task">
            <tr>
              <th>Name</th>
              <td>{{ task.name }}</td>
            </tr>
            <tr>
              <th>ID</th>
              <td>{{ task.id }}</td>
            </tr>
            <tr>
              <th>State</th>
              <td>
                <span
                  class="py-1 px-2 badge"
                  :class="{
                    'bg-success': task.state === 'success',
                    'bg-danger': task.state === 'failure',
                    'bg-warning': task.state === 'pending',
                  }"
                >
                  {{ task.state }}
                </span>
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
              <td>{{ task.startedAt }}</td>
            </tr>
            <tr>
              <th>Finished At</th>
              <td>{{ task.finishedAt }}</td>
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
      </div>
    </div>
  </div>
</template>
