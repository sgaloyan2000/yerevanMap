<template style="height: 100%; width: 100%">
  <div
    classname="container"
    style="
      width: 1300px;
      height: 700px;
      display: flex;
      justify-content: center;
      align-items: center;
    "
  >
    <NuxtPage
      style="display: flex; justify-content: center; align-items: center,height: 100%;"
    />
  </div>
</template>

<script setup>
import App from "~/app.vue";
import { createPinia } from "pinia";
import { createApp } from "vue";
const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
</script>
<style>
html {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
