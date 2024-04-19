import  bus_stop  from "~/server/dbModels/bus_stop";
export default defineEventHandler(async (event) => {

  const body = await readBody(event);
  const curr_lat = body.lat;
  const curr_lng = body.lng;

  function rad(x: any) {
    return x * Math.PI / 180;
  };

  function getDistance(p1: any, p2: any)
  {
    const R = 6378137; // Earth’s mean radius in meter
    const dLat = rad(p2.lat - p1.lat);
    const dLong = rad(p2.lng - p1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d; // returns the distance in meter
  };

  try {
    const kangarData = await bus_stop.find();
    let kangar_list: any = [];
    kangarData.forEach( (kangar) => { 
      kangar_list.push(
        { 
          "lat": kangar.lat, 
          "lng": kangar.lng
        }
      ); 
    });
    let distance_list: any = [];
    kangar_list.forEach( (kangar: any) =>{
      distance_list.push({
        id: kangar.id,
        lng: kangar.lng,
        lat: kangar.lat,
        distance: getDistance(body,kangar)});
    });

   return distance_list.sort(function(a: any, b: any){return a.distance-b.distance})[0];
  } catch (err) {
    console.dir(err);
    event.res.statusCode = 500;
    return {
      code: "ERROR",
      message: "Something went wrong.",
    };
  }
});