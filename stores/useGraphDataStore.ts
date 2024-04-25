import { defineStore } from 'pinia';
import { Loader } from "@googlemaps/js-api-loader"

export const useGraphDataStore = defineStore( 'graphDataStore', () => {
    const rout =ref("Pick 2 points in map to know destination rout.")
    const start_lat = ref(0.0);
    const start_lng = ref(0.0);
    const end_lat = ref(0.0);
    const end_lng = ref(0.0);
    let end_catch_pos = false;
    let map: any = undefined;
    const loader = new Loader({
        apiKey: "AIzaSyCG_6ydqQS3KtktOFUkIB8OgUfr40iCsbU",
        version: "weekly",
        libraries: ['routes', 'places']
    });
    const mapOptions = {
        center: { lat: 40.197665487267, lng: 44.4924828461217 },
        zoom: 16,
    };
    loader.load()
        .then(async (google) => {
            map = new google.maps.Map(document.getElementById("map"), mapOptions);
            const directionsRenderer = new google.maps.DirectionsRenderer();
            const directionsRendererStart = new google.maps.DirectionsRenderer();
            const directionsRendererEnd = new google.maps.DirectionsRenderer();
            const directionsRendererMiddle = new google.maps.DirectionsRenderer();
            const directionsService = new google.maps.DirectionsService();

            function renderDirectionsStart(result: any) {
                directionsRendererStart.setMap(map);
                directionsRendererStart.setDirections(result);
            }
            function renderDirectionsEnd(result: any) {
                directionsRendererEnd.setMap(map);
                directionsRendererEnd.setDirections(result);
            }
            function renderDirectionsMiddle(result: any) {
                directionsRendererMiddle.setMap(map);
                directionsRendererMiddle.setDirections(result);
            }
            function requestDirectionsStart(start: any, end: any) {
                directionsService.route({
                    origin: start,
                    destination: end,
                    travelMode: google.maps.TravelMode["WALKING"]
                }, function(result: any) {
                    renderDirectionsStart(result);
                });
            }
            function requestDirectionsEnd(start: any, end: any) {
                directionsService.route({
                    origin: start,
                    destination: end,
                    travelMode: google.maps.TravelMode["WALKING"]
                }, function(result: any) {
                    renderDirectionsEnd(result);
                });
            }
            function requestDirectionsMiddle(start: any, end: any) {
                directionsService.route({
                    origin: start,
                    destination: end,
                    travelMode: google.maps.TravelMode["DRIVING"]
                }, function(result: any) {
                    renderDirectionsMiddle(result);
                });
            }
            await directionsRenderer.setMap(map);
            map.addListener("click", async (mapsMouseEvent: any) => {
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
        })
        .catch(e => {
            // do something
        });




    return {
        rout,
        start_lat,
        start_lng,
        end_lat,
        end_lng,
        end_catch_pos
    };
})
