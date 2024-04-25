<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script setup >
  import App from '~/app.vue'
  import { createPinia } from 'pinia';
  import { createApp } from 'vue'
  const pinia = createPinia()
  const app = createApp(App)
  app.use(pinia)
</script>
