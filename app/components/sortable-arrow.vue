<script setup lang="ts">
import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from 'lucide-vue-next'

const props = defineProps<{
  order?: string
  clickHandler: () => void
}>()
</script>

<template>
  <ArrowUpDownIcon
    v-if="props.order === undefined"
    :size="15"
    class="cursor-pointer"
    @click="props.clickHandler()"
  />
  <ArrowUpIcon
    v-if="props.order === 'asc'"
    :size="15"
    class="cursor-pointer"
    @click="props.clickHandler()"
  />
  <ArrowDownIcon
    v-if="props.order === 'desc'"
    :size="15"
    class="cursor-pointer"
    @click="props.clickHandler()"
  />
</template>
