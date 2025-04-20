<script setup lang="ts">
import { useAsyncData } from '#app'
import { useIntervalFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import RangePicker from '~/components/range-picker.vue'
import type { TaskSelect } from '~/server/db/schema'
import TasksTable from '~/components/tasks-table.vue'

const route = useRoute()
const router = useRouter()

if (!route.query.page || !route.query.perPage) {
  router.push({ path: '/tasks', query: { page: 1, perPage: 15 } })
}

const searchRef = ref('')
const queryParams = reactive<{
  page: number
  perPage: number
  state?: string
  search?: string
  sortByRuntime?: string
  sortByStartedAt?: string
  startDate?: string
  endDate?: string
}>({
  page: Number(route.query.page) || 1,
  perPage: Number(route.query.perPage) || 15,
  state: route.query.state?.toString(),
  search: route.query.search?.toString(),
  sortByRuntime: route.query.sortByRuntime?.toString(),
  sortByStartedAt: route.query.sortByStartedAt?.toString(),
  startDate: route.query.startDate?.toString(),
  endDate: route.query.endDate?.toString()
})

watch(
  () => route.query,
  async () => {
    queryParams.page = Number(route.query.page) || 1
    queryParams.perPage = Number(route.query.perPage) || 15
    queryParams.state = route.query.state?.toString()
    queryParams.search = route.query.search?.toString()
    queryParams.sortByRuntime = route.query.sortByRuntime?.toString()
    queryParams.sortByStartedAt = route.query.sortByStartedAt?.toString()
    queryParams.startDate = route.query.startDate?.toString()
    queryParams.endDate = route.query.endDate?.toString()
  }
)

const { data, refresh } = useAsyncData<{ tasks: TaskSelect[]; count: number }>(
  'tasks',
  () =>
    $fetch(`/api/tasks`, {
      params: {
        limit: queryParams.perPage,
        state: queryParams.state,
        search: queryParams.search,
        offset: (queryParams.page - 1) * queryParams.perPage,
        sortByRuntime: queryParams.sortByRuntime,
        sortByStartedAt: queryParams.sortByStartedAt,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate
      }
    }),
  {
    watch: [queryParams]
  }
)

const filtersExist = computed(
  () =>
    queryParams.state ||
    queryParams.search ||
    queryParams.sortByRuntime ||
    queryParams.sortByStartedAt ||
    queryParams.startDate ||
    queryParams.endDate
)

watch(queryParams, async () => {
  router.push({
    path: '/tasks',
    query: {
      ...queryParams
    }
  })
})

const totalPages = computed(() =>
  Math.ceil((data.value?.count || 0) / queryParams.perPage)
)

useIntervalFn(() => {
  console.log('REFRESHING...')
  refresh()
}, 2000)

const searchSubmit = () => {
  if (searchRef.value) {
    queryParams.search = searchRef.value
  }
}

const clearFilters = () => {
  router.push({
    path: '/tasks',
    query: {
      page: route.query.perPage,
      perPage: route.query.perPage
    }
  })
}

const sortHandler = (field: 'runtime' | 'startedAt', order: 'asc' | 'desc') => {
  if (field === 'runtime') {
    queryParams.sortByRuntime = order
  }
  if (field === 'startedAt') {
    queryParams.sortByStartedAt = order
  }
}
const stateHandler = (
  state: 'running' | 'success' | 'failure' | 'abandoned'
) => {
  queryParams.page = 1
  queryParams.state = state
}
const searchHandler = (value: string) => {
  searchRef.value = value
  queryParams.search = value
}
provide('queryParams', queryParams)
provide('sortHandler', sortHandler)
provide('stateHandler', stateHandler)
provide('searchHandler', searchHandler)

const handleNext = () => {
  if (queryParams.page < totalPages.value) {
    queryParams.page++
  }
}

const handlePrev = () => {
  if (queryParams.page > 1) {
    queryParams.page--
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="flex justify-between">
      <div>
        <Button class="btn btn-outline-primary">
          <NuxtLink
            to="/api/tasks/backup"
            target="_blank"
          >
            Backup
          </NuxtLink>
        </Button>
      </div>
      <div class="mb-3">
        <div class="flex gap-3">
          <RangePicker />
          <div>
            <Button
              variant="outline"
              v-if="filtersExist"
              @click="clearFilters"
              class="cursor-pointer"
              >Clear Filters</Button
            >
          </div>
          <div class="flex justify-center items-center">
            <p>Per Page:</p>
            <select
              v-model="queryParams.perPage"
              aria-label="Default select example"
            >
              <option value="10">10</option>
              <option
                value="15"
                selected
              >
                15
              </option>
              <option value="20">20</option>
            </select>
          </div>
          <div class="flex">
            <Input
              type="search"
              name="search"
              class="form-control w-auto"
              placeholder="Search tasks..."
              v-model="searchRef"
            />
            <Button
              @click="searchSubmit"
              class="btn btn-primary ml-2"
            >
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>

    <TasksTable
      v-if="data"
      :data="data"
    />

    <div class="flex mt-3 justify-between">
      <div>
        <p>
          <span class="text-foreground">Total</span>:
          {{ data?.count || 0 }}
        </p>
      </div>
      <nav class="flex">
        <Button
          @click="handlePrev"
          :class="{ disabled: queryParams.page === 1 }"
          class="page-link cursor-pointer"
        >
          Previous
        </Button>
        <div class="flex justify-center items-center px-2">
          <span>{{ queryParams.page }} / {{ totalPages }}</span>
        </div>
        <Button
          @click="handleNext"
          class="page-link cursor-pointer"
          :class="{ disabled: queryParams.page === totalPages }"
        >
          Next
        </Button>
      </nav>
    </div>
  </div>
</template>
