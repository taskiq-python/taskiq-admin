<script setup lang="ts">
import { cn } from '@/lib/utils'

import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '~/components/ui/popover'
import { RangeCalendar } from '~/components/ui/range-calendar'
import { type DateRange } from 'reka-ui'
import {
  CalendarDate,
  DateFormatter,
  type DateValue,
  getLocalTimeZone
} from '@internationalized/date'
import { CalendarIcon } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const dateRange = ref({
  start: undefined,
  end: undefined
}) as Ref<DateRange>

const drf = new DateFormatter('en-US', {
  dateStyle: 'medium'
})

watch(dateRange, async () => {
  router.push({
    path: '/tasks',
    query: {
      ...route.params,
      startDate: dateRange.value.start?.toString(),
      endDate: dateRange.value.end?.toString()
    }
  })
})
</script>

<template>
  <div class="flex flex-col items-start gap-4 md:flex-row">
    <Popover>
      <PopoverTrigger as-child>
        <Button
          id="date"
          :variant="'outline'"
          :class="
            cn(
              'w-fit justify-start px-2 font-normal',
              !dateRange && 'text-muted-foreground'
            )
          "
        >
          <CalendarIcon class="text-muted-foreground" />

          <template v-if="dateRange.start">
            <template v-if="dateRange.end">
              {{ drf.format(dateRange.start.toDate(getLocalTimeZone())) }} -
              {{ drf.format(dateRange.end.toDate(getLocalTimeZone())) }}
            </template>

            <template v-else>
              {{ drf.format(dateRange.start.toDate(getLocalTimeZone())) }}
            </template>
          </template>
          <template v-else> Pick a date </template>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        class="w-auto p-0"
        align="start"
      >
        <RangeCalendar
          v-model="dateRange"
          :number-of-months="2"
          initial-focus
        />
      </PopoverContent>
    </Popover>
  </div>
</template>
