<script setup lang="ts">
import Theme from '~/components/theme.vue'
</script>
<template>
  <header class="h-14 text-foreground border-b-2 flex">
    <div class="container m-auto flex justify-between">
      <NuxtLink
        class="no-underline"
        to="/"
        ><h3 class="text-2xl font-bold">Taskiq Admin</h3></NuxtLink
      >
      <Theme />
    </div>
  </header>
</template>
