<script setup lang="ts">
import { useAsyncData } from '#app'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'
import { computed, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import RangePicker from '~/components/range-picker.vue'
import type { TaskSelect } from '~~/shared/db/schema'
import TasksTable from '~/components/tasks-table.vue'
import { StateEnum, type QueryParams, type TaskState } from '~~/shared/types'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem
} from '~/components/ui/select'

const route = useRoute()
const router = useRouter()
const perPageStorage = useLocalStorage<number>('tasks-per-page', 15)

if (!route.query.page || !route.query.perPage) {
  router.push({
    path: '/tasks',
    query: { page: 1, perPage: perPageStorage.value }
  })
}

const searchRef = ref('')
const refreshSeconds = ref(5)
const refreshActivated = ref(true)
const queryParams = reactive<QueryParams>({
  page: Number(route.query.page) || 1,
  perPage: Number(route.query.perPage) || perPageStorage.value,
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
    queryParams.perPage = Number(route.query.perPage) || perPageStorage.value
    queryParams.state = route.query.state?.toString()
    queryParams.search = route.query.search?.toString()
    queryParams.sortByRuntime = route.query.sortByRuntime?.toString()
    queryParams.sortByStartedAt = route.query.sortByStartedAt?.toString()
    queryParams.sortByQueuedAt = route.query.sortByQueuedAt?.toString()
    queryParams.startDate = route.query.startDate?.toString()
    queryParams.endDate = route.query.endDate?.toString()
  }
)

watch(
  () => queryParams.perPage,
  (perPage) => {
    if (perPageStorage.value !== perPage) {
      perPageStorage.value = perPage
    }
  }
)

watch(perPageStorage, (storedPerPage) => {
  if (queryParams.perPage !== storedPerPage) {
    queryParams.perPage = storedPerPage
  }
})

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
        sortByQueuedAt: queryParams.sortByQueuedAt,
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
    queryParams.sortByQueuedAt ||
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

const MIN_REFRESH_SECONDS = 1
const MAX_REFRESH_SECONDS = 30

watch(refreshSeconds, (value) => {
  if (!Number.isFinite(value)) {
    refreshSeconds.value = MIN_REFRESH_SECONDS
    return
  }
  refreshSeconds.value = Math.min(
    MAX_REFRESH_SECONDS,
    Math.max(MIN_REFRESH_SECONDS, Math.round(value))
  )
})

const totalPages = computed(() =>
  Math.ceil((data.value?.count || 0) / queryParams.perPage)
)

const refreshMilliseconds = computed(() => refreshSeconds.value * 1000)
useIntervalFn(() => {
  if (refreshSeconds.value > 0 && refreshActivated.value) {
    refresh()
  }
}, refreshMilliseconds)

const searchSubmit = () => {
  if (searchRef.value) {
    queryParams.search = searchRef.value
  }
}

const clearFilters = () => {
  router.push({
    path: '/tasks',
    query: {
      page: route.query.page,
      perPage: route.query.perPage
    }
  })
}

const sortHandler = (
  field: 'QueuedAt' | 'Runtime' | 'StartedAt',
  order: 'asc' | 'desc'
) => {
  if (field === 'QueuedAt') {
    queryParams.sortByQueuedAt = order
  } else if (field === 'Runtime') {
    queryParams.sortByRuntime = order
  } else if (field === 'StartedAt') {
    queryParams.sortByStartedAt = order
  } else {
    throw new Error('Invalid sorting key is provided')
  }
}

const stateHandler = (state: TaskState) => {
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
          <div class="flex justify-center items-center gap-2">
            <Checkbox
              v-model="refreshActivated"
              class="cursor-pointer"
            />
            <div
              class="flex justify-center items-center gap-2"
              :class="{ 'opacity-50 pointer-events-none': !refreshActivated }"
            >
              <span>Refresh each</span>
              <Input
                type="number"
                class="w-16 px-2 text-center"
                :min="MIN_REFRESH_SECONDS"
                :max="MAX_REFRESH_SECONDS"
                v-model.number="refreshSeconds"
              />
              <span>second(s)</span>
            </div>
          </div>
          <div class="flex">
            <Select
              :model-value="queryParams.state"
              @update:model-value="(e) => stateHandler(e as TaskState)"
            >
              <SelectTrigger class="w-[140px] cursor-pointer">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="state in Object.values(StateEnum)"
                  :key="state"
                  :value="state"
                  class="cursor-pointer"
                >
                  <TaskState :state="state" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
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
      <div class="flex justify-center items-center gap-6">
        <div>
          <p>
            <span class="text-foreground">Total</span>:
            {{ data?.count || 0 }}
          </p>
        </div>
        <div class="flex justify-center items-center gap-1">
          <p>Per Page:</p>
          <select
            v-model.number="queryParams.perPage"
            aria-label="Default select example"
            class="border rounded-md text-center cursor-pointer p-1"
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
