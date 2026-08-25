<script setup lang="ts">
import { useAsyncData } from '#app'
import { useIntervalFn } from '@vueuse/core'
import { computed, provide, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { ScheduleSelect } from '~~/shared/db/schema'
import SchedulesTable from '~/components/schedules-table.vue'
import {
  ScheduleStatusEnum,
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

const page = ref(1)
const perPage = ref(15)
const sourceName = ref<string | undefined>(undefined)
const status = ref<ScheduleStatus | undefined>(undefined)
const searchRef = ref('')
const search = ref<string | undefined>(undefined)
const scheduleId = ref<string | undefined>(
  route.query.scheduleId?.toString() || undefined
)

const { data, refresh } = useAsyncData<{
  schedules: ScheduleSelect[]
  count: number
  pendingCommands: Record<string, string>
}>(
  'scheduled-definitions',
  () =>
    $fetch(`/api/schedules`, {
      params: {
        kind: 'recurring',
        limit: perPage.value,
        offset: (page.value - 1) * perPage.value,
        sourceName: sourceName.value,
        status: status.value,
        search: search.value,
        scheduleId: scheduleId.value
      }
    }),
  {
    watch: [page, perPage, sourceName, status, search, scheduleId]
  }
)

const { data: sourcesData } = useAsyncData<{
  sources: { name: string; editable: boolean }[]
}>('schedule-sources', () => $fetch('/api/schedules/sources'))

const filtersExist = computed(
  () => sourceName.value || status.value || search.value || scheduleId.value
)

const totalPages = computed(() =>
  Math.ceil((data.value?.count || 0) / perPage.value)
)

useIntervalFn(() => {
  refresh()
}, 5000)

const searchSubmit = () => {
  if (searchRef.value) {
    page.value = 1
    search.value = searchRef.value
  }
}

const clearFilters = () => {
  page.value = 1
  sourceName.value = undefined
  status.value = undefined
  search.value = undefined
  searchRef.value = ''
  scheduleId.value = undefined
  if (route.query.scheduleId) {
    router.push({ path: '/tasks', query: { view: 'scheduled' } })
  }
}

provide('refreshHandler', refresh)

const handleNext = () => {
  if (page.value < totalPages.value) {
    page.value++
  }
}

const handlePrev = () => {
  if (page.value > 1) {
    page.value--
  }
}
</script>

<template>
  <div>
    <div class="flex justify-end">
      <div class="mb-3">
        <div class="flex gap-3 items-center">
          <span
            v-if="scheduleId"
            class="text-sm text-muted-foreground border rounded px-2 py-1"
          >
            schedule: {{ scheduleId }}
          </span>
          <div class="flex">
            <Select
              :model-value="sourceName"
              @update:model-value="
                (e) => {
                  page = 1
                  sourceName = e as string
                }
              "
            >
              <SelectTrigger class="w-[150px] cursor-pointer">
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
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex">
            <Select
              :model-value="status"
              @update:model-value="
                (e) => {
                  page = 1
                  status = e as ScheduleStatus
                }
              "
            >
              <SelectTrigger class="w-[130px] cursor-pointer">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="statusOption in Object.values(ScheduleStatusEnum)"
                  :key="statusOption"
                  :value="statusOption"
                  class="cursor-pointer"
                >
                  <ScheduleStatus :status="statusOption" />
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
      <div>
        <p>
          <span class="text-foreground">Total</span>:
          {{ data?.count || 0 }}
        </p>
      </div>
      <nav class="flex">
        <Button
          @click="handlePrev"
          :class="{ disabled: page === 1 }"
          class="page-link cursor-pointer"
        >
          Previous
        </Button>
        <div class="flex justify-center items-center px-2">
          <span>{{ page }} / {{ totalPages }}</span>
        </div>
        <Button
          @click="handleNext"
          class="page-link cursor-pointer"
          :class="{ disabled: page === totalPages }"
        >
          Next
        </Button>
      </nav>
    </div>
  </div>
</template>
