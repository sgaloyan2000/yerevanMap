<template style="height: 100%">
  <div classname="tem" style="width: 100%; height: 100%">
    <div
      classname="div1"
      style="
        width: 100%;
        min-height: 500px;
        display: flex;
        justify-content: center;
        flex-direction: row;
        align-items: flex-start;
        gap: 30px;
      "
    >
      <div id="map" style="width: 100%; height: 100%"></div>
      <div
        classname="right-column"
        style="
          width: 30%;
          height: fit-content;
          display: flex;
          justify-content: flex-start;
          flex-direction: column;
          align-items: center;
          border: 1px solid black;
        "
      >
        <div
          classname="div2"
          style="
            width: 100%;
            display: flex;
            justify-content: center;
            flex-direction: row;
            align-items: center;
            gap: 15px;
          "
        >
          <div>
            <h4>Սկզբնակետ</h4>
            <h4>{{ graphDataStore.start_name }}</h4>
          </div>
          <div>
            <h4>Վերջնակետ</h4>
            <h4>{{ graphDataStore.end_name }}</h4>
          </div>
        </div>
        <div style="max-height: 600px; overflow-y: auto">
          <div v-for="(data, index) in graphDataStore.rout" :key="index">
            <h4>Քայլ {{ index + 1 }}</h4>
            <p>Կանգառ N: {{ data.id }} Ավտոբուս N: {{ data.bus }}</p>
            <p></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGraphDataStore } from "~/stores/useGraphDataStore.ts";
const graphDataStore = useGraphDataStore();
</script>

<style scoped>
h4 {
  text-align: center;
}
</style>
