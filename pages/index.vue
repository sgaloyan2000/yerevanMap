<template>
  <div>
    <div>
      <table>
        <tr>
          <td style="width: 70%;">
            <div id="map" style="width: 100%; min-height: 500px;"></div>
          </td>
          <td style="width: 30%; ">
            <table style="width: 100%;">
              <tr style="width: 100%;">
                <td><h4>Սկզբնակետ</h4></td>
                <td><h4>Վերջնակետ</h4></td>
              </tr>
              <tr>
                <td><h4>{{ graphDataStore.start_name }}</h4></td>
                <td><h4>{{ graphDataStore.end_name }}</h4></td>
              </tr>
            </table>
            <div style="max-height: 300px; overflow-y: scroll; margin-right: 20px;">
            <table style="width: 100%; overflow-y: scroll; ">
              <tr v-for="(data, index) in graphDataStore.rout" :key="index">
                <td>
                  <h4>Քայլ {{ index + 1 }}</h4>
                  <p>Կանգառ N: {{ data.id }} Ավտոբուս N: {{ data.bus }}</p>
                  <p></p>
                </td>
              </tr>
            </table>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>

</template>

<script setup >
import {useGraphDataStore} from "~/stores/useGraphDataStore.ts";
const graphDataStore = useGraphDataStore();
</script>

<style scoped>
table{
  padding: 3px;
  margin: 10px;
  border-style: solid;
  border-color: blue;
  }
th, td {
  vertical-align: top; /* Align content at the top of each cell */
}
th {
  text-align: center;
}
h4{
  text-align: center;
}
</style>
