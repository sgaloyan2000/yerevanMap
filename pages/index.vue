<template>
  <div>
    <div>
      <table>
        <tr>
          <td>
            <h4>Start Position</h4>
          </td>
          <td>
            <h4>End Position</h4>
          </td>
          <td>
            <h4>Rout</h4>
          </td>
        </tr>
        <tr>
          <td>
            <h4>{{ graphDataStore.start_lat }}, {{ graphDataStore.start_lng }}</h4>
          </td>
          <td>
            <h4>{{ graphDataStore.end_lat }}, {{ graphDataStore.end_lng }}</h4>
          </td>
          <td>
            <h4>{{ graphDataStore.rout }}</h4>
          </td>
        </tr>
      </table>
    </div>
    <div id="map" style="width: 100%; height: 500px"></div>
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
  width: 100%;
  border-style: solid;
  border-color: blue;
  }
tr{
  border: solid blueviolet;
}
td{
  border: solid blue;
}
h4{
  text-align: center;
}
</style>
