<script setup lang="ts">
import { formatDate } from "~/utils"
import { useIntervalFn } from "@vueuse/core"
import type { TaskSelect } from "~/server/db/schema"

const route = useRoute()
const router = useRouter()

if (!route.query.page) {
  router.replace({ path: "/tasks", query: { page: 1 } })
}

const perPage = 10
const searchRef = ref("")

const state = computed(() => route.query.state)
const search = computed(() => route.query.search || "")
const page = computed(() => Number(route.query.page) || 1)

const { data, refresh } = useAsyncData<{ tasks: TaskSelect[]; count: number }>(
  "tasks",
  () =>
    $fetch(`/api/tasks`, {
      params: {
        limit: perPage,
        state: state.value,
        search: search.value,
        offset: (page.value - 1) * perPage,
      },
    }),
  {
    watch: [page, search, state],
  }
)

useIntervalFn(() => {
  console.log("REFRESHING...")
  refresh()
}, 3000)

const totalPages = computed(() => Math.ceil((data.value?.count || 0) / perPage))

const limitText = (text: string, length: number) => {
  if (text.length > length) {
    return text.slice(0, length).trim() + "..."
  }
  return text
}

const formatReturnValue = (task: TaskSelect) => {
  if (task.returnValue?.return_value) {
    return task.returnValue.return_value
  } else {
    return "null"
  }
}

// temporarily, while dishka hasn't fixed it's module naming bug
const formatTaskName = (taskName: string) => {
  if (taskName.includes(":")) {
    const parts = taskName.split(":")
    return parts[parts.length - 1]
  } else {
    return taskName
  }
}

const stateHandler = (
  state: "running" | "success" | "failure" | "abandoned"
) => {
  router.push({
    path: "/tasks",
    query: {
      page: 1,
      state: state,
      search: searchRef.value || undefined,
    },
  })
}

const searchSubmit = () => {
  if (searchRef.value) {
    router.push({
      path: "/tasks",
      query: {
        page: 1,
        search: searchRef.value,
      },
    })
  }
}

const handleNext = () => {
  if (page.value < totalPages.value) {
    router.push({
      path: "/tasks",
      query: {
        page: page.value + 1,
        state: state.value,
        search: searchRef.value || undefined,
      },
    })
  }
}

const handlePrev = () => {
  if (page.value > 1) {
    router.push({
      path: "/tasks",
      query: {
        page: page.value - 1,
        state: state.value,
        search: searchRef.value || undefined,
      },
    })
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="flex justify-between">
      <div>
        <button class="btn btn-outline-primary">
          <NuxtLink to="/api/tasks/backup" target="_blank"> Backup </NuxtLink>
        </button>
      </div>
      <div class="row mb-3">
        <div class="col">
          <div class="d-flex justify-content-end">
            <input
              type="search"
              name="search"
              class="form-control w-auto"
              placeholder="Search tasks..."
              v-model="searchRef"
            />
            <button @click="searchSubmit" class="btn btn-primary ml-2">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-striped table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>State</th>
            <th>Args</th>
            <th>Kwargs</th>
            <th>Result</th>
            <th>Started</th>
            <th>Finished</th>
            <th>Runtime (s)</th>
            <th>Worker</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data" v-for="task in data.tasks">
            <td class="task-name-td">{{ formatTaskName(task.name) }}</td>
            <td>
              <NuxtLink :to="{ name: 'tasks-id', params: { id: task.id } }">
                {{ task.id }}
              </NuxtLink>
            </td>
            <td>
              <span
                @click="stateHandler(task.state)"
                class="py-1 px-2 badge cursor-pointer"
                :class="{
                  'bg-success': task.state === 'success',
                  'bg-danger': task.state === 'failure',
                  'bg-warning': task.state === 'running',
                  'bg-dark': task.state === 'abandoned',
                }"
              >
                {{ task.state }}
              </span>
            </td>
            <td>{{ task.args }}</td>
            <td>{{ limitText(JSON.stringify(task.kwargs), 40) }}</td>
            <td>{{ limitText(formatReturnValue(task), 21) }}</td>
            <td>{{ formatDate(String(task.startedAt)) }}</td>
            <td>
              {{ task.finishedAt ? formatDate(String(task.finishedAt)) : null }}
            </td>
            <td>{{ task.executionTime }}</td>
            <td>{{ task.worker }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="d-flex justify-content-end mt-3">
      <nav>
        <ul class="pagination">
          <li class="page-item">
            <button
              @click="handlePrev"
              :class="{ disabled: page === 1 }"
              class="page-link cursor-pointer"
            >
              Previous
            </button>
          </li>
          <div class="flex justify-center items-center px-2">
            <span>{{ page }} / {{ totalPages }}</span>
          </div>
          <li class="page-item">
            <button
              @click="handleNext"
              class="page-link cursor-pointer"
              :class="{ disabled: page === totalPages }"
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
<style scoped>
.task-name-td {
  max-width: 300px;
  overflow-x: scroll;
  scrollbar-width: thin;
}
</style>
