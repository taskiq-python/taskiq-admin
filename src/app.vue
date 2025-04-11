<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import Header from '~/components/header.vue'
</script>
<template>
  <Header />
  <div class="container m-auto">
    <NuxtPage />
  </div>
  <ClientOnly>
    <Toaster />
  </ClientOnly>
</template>
