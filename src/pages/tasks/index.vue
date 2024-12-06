<script setup lang="ts">
const route = useRoute()
const router = useRouter()

if (!route.query.page) {
  router.replace({ path: "/tasks", query: { page: 1 } })
}

const perPage = 10
const searchRef = ref("")

const page = computed(() => Number(route.query.page) || 1)
const search = computed(() => Number(route.query.search) || "")

const { data } = useAsyncData(
  "tasks",
  () =>
    $fetch(`/api/tasks`, {
      params: {
        limit: perPage,
        search: search.value,
        offset: (page.value - 1) * perPage,
      },
    }),
  {
    watch: [page, search],
  }
)

const totalPages = computed(() => Math.ceil((data.value?.count || 0) / perPage))

function handleNext() {
  router.push({
    path: "/tasks",
    query: {
      page: page.value + 1,
      search: searchRef.value || undefined,
    },
  })
}

function handlePrev() {
  router.push({
    path: "/tasks",
    query: {
      page: page.value - 1,
      search: searchRef.value || undefined,
    },
  })
}
</script>

<template>
  <div class="container-fluid py-4">
    <form method="get" action="">
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
            <button type="submit" class="btn btn-primary ml-2">Search</button>
          </div>
        </div>
      </div>
    </form>

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
            <th>Runtime</th>
            <th>Worker</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="data" v-for="task in data.tasks">
            <td>{{ task.name }}</td>
            <td>
              <NuxtLink :to="{ name: 'tasks-id', params: { id: task.id } }">
                {{ task.id }}
              </NuxtLink>
            </td>
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
            <td>{{ task.args }}</td>
            <td>{{ task.kwargs }}</td>
            <td>{{ task.returnValue }}</td>
            <td>{{ task.startedAt }}</td>
            <td>{{ task.finishedAt }}</td>
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
            <span
              @click="handlePrev"
              :class="{ disabled: page === 1 }"
              class="page-link cursor-pointer"
              >Previous</span
            >
          </li>
          <span>{{ page }} / {{ totalPages }}</span>
          <li class="page-item">
            <span
              @click="handleNext"
              class="page-link cursor-pointer"
              :class="{ disabled: page === totalPages }"
              >Next</span
            >
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>
