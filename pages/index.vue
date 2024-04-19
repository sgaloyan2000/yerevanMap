<template>
  <div>
    <div>
      <h5>{{ serzh_lat }} {{ serzh_lng }}</h5>
    </div>
    <div id="map" style="width: 100%; height: 500px"></div>
  </div>
  
</template>

<script setup >
import {Loader} from "@googlemaps/js-api-loader"

const serzh_lat = ref(0.0);
const serzh_lng = ref(0.0);

const loader = new Loader({
  apiKey: "AIzaSyCG_6ydqQS3KtktOFUkIB8OgUfr40iCsbU",
  version: "weekly",
  libraries: ['routes', 'places']
});

loader.load().then(async () => {
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const directionsService = new google.maps.DirectionsService();
  const { Map } = await google.maps.importLibrary("maps");
  const map = new Map(document.getElementById("map"), 
  {
    center: { lat: 40.197665487267, lng: 44.4924828461217 },
    zoom: 16,
  });
  directionsRenderer.setMap(map);
  map.addListener("click", async (mapsMouseEvent) => {
    serzh_lat.value = mapsMouseEvent.latLng.toJSON().lat;
    serzh_lng.value = mapsMouseEvent.latLng.toJSON().lng;
    let dr = await $fetch("/api/get_my_loc", {
      method: "POST",
      body: {
        lat: serzh_lat.value,
        lng: serzh_lng.value
      }
    });
    await directionsService.route({
      origin: { lat: serzh_lat.value, lng: serzh_lng.value },
      destination: { lat: dr.lat, lng: dr.lng }, 
      travelMode: google.maps.TravelMode["WALKING"],
    }).then((response) => {
      directionsRenderer.setDirections(response);
    }).catch((e) => window.alert("Directions request failed due to " + e));
  });

});
</script>
