<script setup lang="ts">
import { useAsyncData } from '#app'
import { useIntervalFn, useLocalStorage } from '@vueuse/core'
import { computed, provide, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Checkbox } from '~/components/ui/checkbox'
import type { ScheduleSelect } from '~~/shared/db/schema'
import SchedulesTable from '~/components/schedules-table.vue'
import {
  ScheduleStatusEnum,
  type ScheduleQueryParams,
  type ScheduleStatus
} from '~~/shared/types'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem
} from '~/components/ui/select'

const route = useRoute()
const router = useRouter()
const perPageStorage = useLocalStorage<number>('schedules-per-page', 15)

if (!route.query.page || !route.query.perPage) {
  router.push({
    path: '/schedules',
    query: { page: 1, perPage: perPageStorage.value }
  })
}

const searchRef = ref('')
const refreshSeconds = ref(5)
const refreshActivated = ref(true)
const queryParams = reactive<ScheduleQueryParams>({
  page: Number(route.query.page) || 1,
  perPage: Number(route.query.perPage) || perPageStorage.value,
  sourceName: route.query.sourceName?.toString(),
  status: route.query.status?.toString(),
  search: route.query.search?.toString()
})

watch(
  () => route.query,
  async () => {
    queryParams.page = Number(route.query.page) || 1
    queryParams.perPage = Number(route.query.perPage) || perPageStorage.value
    queryParams.sourceName = route.query.sourceName?.toString()
    queryParams.status = route.query.status?.toString()
    queryParams.search = route.query.search?.toString()
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

const { data, refresh } = useAsyncData<{
  schedules: ScheduleSelect[]
  count: number
  pendingCommands: Record<string, string>
}>(
  'schedules',
  () =>
    $fetch(`/api/schedules`, {
      params: {
        limit: queryParams.perPage,
        offset: (queryParams.page - 1) * queryParams.perPage,
        sourceName: queryParams.sourceName,
        status: queryParams.status,
        search: queryParams.search
      }
    }),
  {
    watch: [queryParams]
  }
)

const { data: sourcesData } = useAsyncData<{ sources: string[] }>(
  'schedule-sources',
  () => $fetch('/api/schedules/sources')
)

const filtersExist = computed(
  () => queryParams.sourceName || queryParams.status || queryParams.search
)

watch(queryParams, async () => {
  router.push({
    path: '/schedules',
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
    path: '/schedules',
    query: {
      page: route.query.page,
      perPage: route.query.perPage
    }
  })
}

const sourceHandler = (sourceName: string) => {
  queryParams.page = 1
  queryParams.sourceName = sourceName
}

const statusHandler = (status: ScheduleStatus) => {
  queryParams.page = 1
  queryParams.status = status
}

provide('queryParams', queryParams)
provide('refreshHandler', refresh)

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
      <div class="flex gap-2">
        <RunTaskDialog />
        <Button
          class="btn btn-outline-primary"
          variant="outline"
        >
          <NuxtLink to="/schedules/commands"> Commands </NuxtLink>
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
              :model-value="queryParams.sourceName"
              @update:model-value="(e) => sourceHandler(e as string)"
            >
              <SelectTrigger class="w-[150px] cursor-pointer">
                <SelectValue placeholder="Select Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="source in sourcesData?.sources || []"
                  :key="source"
                  :value="source"
                  class="cursor-pointer"
                >
                  {{ source }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex">
            <Select
              :model-value="queryParams.status"
              @update:model-value="(e) => statusHandler(e as ScheduleStatus)"
            >
              <SelectTrigger class="w-[130px] cursor-pointer">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="status in Object.values(ScheduleStatusEnum)"
                  :key="status"
                  :value="status"
                  class="cursor-pointer"
                >
                  <ScheduleStatus :status="status" />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              placeholder="Search schedules..."
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

    <SchedulesTable
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
