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
            <h4>{{ start_lat }}, {{ start_lng }}</h4>
          </td>
          <td>
            <h4>{{ end_lat }}, {{ end_lng }}</h4>
          </td>
          <td>
            <h4>{{ rout }}</h4>
          </td>
        </tr>
      </table>
    </div>
    <div id="map" style="width: 100%; height: 500px"></div>
  </div>

</template>

<script setup >
import {Loader} from "@googlemaps/js-api-loader"

const rout =ref("Pick 2 points in map to know destination rout.")
const start_lat = ref(0.0);
const start_lng = ref(0.0);
const end_lat = ref(0.0);
const end_lng = ref(0.0);
let end_catch_pos = false;

const loader = new Loader({
  apiKey: "AIzaSyCG_6ydqQS3KtktOFUkIB8OgUfr40iCsbU",
  version: "weekly",
  libraries: ['routes', 'places']
});

loader.load().then(async () => {
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const directionsRendererStart = new google.maps.DirectionsRenderer();
  const directionsRendererEnd = new google.maps.DirectionsRenderer();
  const directionsRendererMiddle = new google.maps.DirectionsRenderer();
  const directionsService = new google.maps.DirectionsService();

  function renderDirectionsStart(result) {
      directionsRendererStart.setMap(map);
      directionsRendererStart.setDirections(result);
  }
  function renderDirectionsEnd(result) {
    directionsRendererEnd.setMap(map);
    directionsRendererEnd.setDirections(result);
  }
  function renderDirectionsMiddle(result) {
    directionsRendererMiddle.setMap(map);
    directionsRendererMiddle.setDirections(result);
  }
  function requestDirectionsStart(start, end) {
    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode["WALKING"]
    }, function(result) {
      renderDirectionsStart(result);
    });
  }
  function requestDirectionsEnd(start, end) {
    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode["WALKING"]
    }, function(result) {
      renderDirectionsEnd(result);
    });
  }
  function requestDirectionsMiddle(start, end) {
    directionsService.route({
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode["DRIVING"]
    }, function(result) {
      renderDirectionsMiddle(result);
    });
  }
  const { Map } = await google.maps.importLibrary("maps");
  const map = new Map(document.getElementById("map"),
  {
    center: { lat: 40.197665487267, lng: 44.4924828461217 },
    zoom: 16,
  });
  directionsRenderer.setMap(map);
  map.addListener("click", async (mapsMouseEvent) => {
    if (!end_catch_pos) {
      start_lat.value = mapsMouseEvent.latLng.toJSON().lat;
      start_lng.value = mapsMouseEvent.latLng.toJSON().lng;
      end_catch_pos = true;
    } else {
      end_lat.value = mapsMouseEvent.latLng.toJSON().lat;
      end_lng.value = mapsMouseEvent.latLng.toJSON().lng;
      end_catch_pos = false;
      let dr = await $fetch("/api/get_my_loc", {
        method: "POST",
        body: {
          start_lat: start_lat.value,
          start_lng: start_lng.value,
          end_lat: end_lat.value,
          end_lng: end_lng.value
        }
      });
      requestDirectionsStart({ lat: start_lat.value, lng: start_lng.value }, { lat: dr.start_lat, lng: dr.start_lng });
      requestDirectionsEnd({ lat: dr.end_lat, lng: dr.end_lng }, { lat: end_lat.value, lng: end_lng.value });
      requestDirectionsMiddle({ lat: dr.start_lat, lng: dr.start_lng }, { lat: dr.end_lat, lng: dr.end_lng });
      rout.value = dr.busInfo;
    }
  });
});

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
