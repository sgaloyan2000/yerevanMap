import bus_stop from "~/server/dbModels/bus_stop";
import drive from "~/server/dbModels/drive";

export default defineEventHandler(async (event) => {
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  class BusStop {
    stop_id: number;
    name: string;
    latitude: number;
    longitude: number;
    routes: BusRoute[];

    constructor(stop_id: number, name: string, latitude: number, longitude: number) {
      this.stop_id = stop_id;
      this.name = name;
      this.latitude = latitude;
      this.longitude = longitude;
      this.routes = [];
    }
  }

  class BusRoute {
    route_number: string;
    forward_stops: BusStop[];
    backward_stops: BusStop[];

    constructor(route_number: string, forward_stops: BusStop[], backward_stops: BusStop[]) {
      this.route_number = route_number;
      this.forward_stops = forward_stops;
      this.backward_stops = backward_stops;
    }
  }

  class BusRouteManager {
    routes: BusRoute[];

    constructor() {
      this.routes = [];
    }

    add_route(route_number: string, forward_stops: BusStop[], backward_stops: BusStop[]) {
      const route = new BusRoute(route_number, forward_stops, backward_stops);
      this.routes.push(route);
      forward_stops.forEach(fs => {
        try {
        console.log("BusRouteManager: add_route: " + route_number + " fs:" + fs.stop_id)
        } catch (e) {
          console.log("ERROR BusRouteManager: add_route: " + route_number)
        }
      })
      backward_stops.forEach(bs => {
        try {
          console.log("BusRouteManager: add_route: " + route_number + " bs:" + bs.stop_id)
        } catch (e) {
          console.log("ERROR BusRouteManager: add_route: " + route_number)
        }
      })
    }
    find_stops_by_route(route_number: string): BusStop[] | null {
      const route = this.routes.find(route => route.route_number === route_number);
      return route ? route.forward_stops : null;
    }
  }

  class BusStopManager {
    stops: BusStop[];

    constructor() {
      this.stops = [];
    }

    add_stop(stop_id: number, name: string, latitude: number, longitude: number) {
      const stop = new BusStop(stop_id, name, latitude, longitude);
      this.stops.push(stop);
    }

    find_stop_by_name(name: string): BusStop | null {
      return this.stops.find(stop => stop.name.toLowerCase() === name.toLowerCase()) || null;
    }

    find_stop_by_id(id: number): BusStop | null {
      return this.stops.find(stop => stop.stop_id === id) || null;
    }

    get_all_stops(): BusStop[] {
      return this.stops;
    }

    get_nearby_stops(latitude: number, longitude: number, radius: number): BusStop[] {
      return this.stops.filter(stop => {
        const distance = this.calculate_distance(latitude, longitude, stop.latitude, stop.longitude);
        return distance <= radius;
      });
    }

    calculate_distance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const R = 6371.0;
      const dlon = lon2 - lon1;
      const dlat = lat2 - lat1;
      const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    }
  }

  class TravelPlanner {
    bus_stop_manager: BusStopManager;
    bus_route_manager: BusRouteManager;

    constructor(bus_stop_manager: BusStopManager, bus_route_manager: BusRouteManager) {
      this.bus_stop_manager = bus_stop_manager;
      this.bus_route_manager = bus_route_manager;
    }

    find_optimal_route(start_stop_: any, end_stop_: any): [string[][], BusStop[]] | [null, null] {
      const start_stop: BusStop | null = this.bus_stop_manager.find_stop_by_id(start_stop_.id);
      const end_stop = this.bus_stop_manager.find_stop_by_id(end_stop_.id);

      if ((start_stop!=null && !start_stop.stop_id) || (end_stop!=null && !end_stop.stop_id)) {
        return [null, null];
      }

      const distances: { [key: string]: number } = {};
      distances[start_stop.stop_id] = 0;
      const pq: [number, BusStop][] = [[0, start_stop]];
      const previous_stop: { [key: string]: BusStop | undefined } = {};

      while (pq.length) {
        const [current_distance, current_stop] = pq.shift()!;
        if (current_stop.stop_id === end_stop.stop_id) {
          break;
        }

        const neighbors = this.get_neighbors(current_stop);
        for (const neighbor_stop of neighbors) {
          try {
            const distance = current_distance + this.bus_stop_manager.calculate_distance(
                current_stop.latitude, current_stop.longitude,
                neighbor_stop.latitude, neighbor_stop.longitude
            );
            if (distance < (distances[neighbor_stop.stop_id] || Infinity)) {
              distances[neighbor_stop.stop_id] = distance;
              previous_stop[neighbor_stop.stop_id] = current_stop;
              pq.push([distance, neighbor_stop]);
              pq.sort((a, b) => a[0] - b[0]);
            }
          } catch (e) {
          }
        }
      }

      let optimal_route: BusStop[] = [];
      let current: BusStop | undefined = end_stop;

      if (current) {
        while (current !== start_stop) {
          if (!current) break; // Break if current is undefined

          optimal_route.unshift(current);
          current = previous_stop[current.stop_id];
        }
        if (current === start_stop[0]) {
          optimal_route.unshift(current);
        }
      }
      if (optimal_route.length === 1 && optimal_route[0] !== start_stop) {
        return [null, null];
      }

      let buses: string[][] = [];
      for (let i = 0; i < optimal_route.length - 1; i++) {
         buses.push(this.find_buses_between_stops(optimal_route[i], optimal_route[i + 1]));
      }

      return [buses, optimal_route];
    }

    get_neighbors(stop: BusStop): BusStop[] {
      const neighbors: BusStop[] = [];
      for (const route of this.bus_route_manager.routes) {
          if (route.backward_stops.includes(stop)) {
            const index = route.backward_stops.indexOf(stop);
            if (index < route.backward_stops.length - 1) {
              neighbors.push(route.backward_stops[index + 1]);
            }
          }
          if (route.forward_stops.includes(stop)) {
            const index = route.forward_stops.indexOf(stop);
            if (index < route.forward_stops.length - 1) {
              neighbors.push(route.forward_stops[index + 1]);
            }
          }
      }
      return neighbors;
    }

    find_buses_between_stops(stop1: BusStop, stop2: BusStop): string[] {
      const buses: any[] = [];
      for (const route of this.bus_route_manager.routes) {
        if (route.forward_stops.includes(stop1) && route.forward_stops.includes(stop2)) {
          buses.push({
            "dir":  "forward",
            "route_number": route.route_number
          });
        }
        if (route.backward_stops.includes(stop1) && route.backward_stops.includes(stop2)) {
          buses.push({
            "dir":  "backward",
            "route_number": route.route_number
          });
        }
      }
      return buses;
    }
  }

  const bus_stop_manager = new BusStopManager();
  const bus_route_manager = new BusRouteManager();

// Add bus stops
  const busStops = await bus_stop.find();
  busStops.forEach( (bs) => {
    bus_stop_manager.add_stop(<number>bs.id, <string>bs.name, <number>bs.lat, <number>bs.lng);
  });

// Add bus routes
  const busRouts = await drive.find();
  busRouts.forEach( (rout) => {
    const bsm1: BusStop[] = [];
    const bsm2: BusStop[] = [];
    rout.Dir1.forEach( (d1) => {
      const b = bus_stop_manager.find_stop_by_id(d1);
      if (b!==null)
        bsm1.push(b)
    })
    rout.Dir2.forEach( (d2) => {
      const b = bus_stop_manager.find_stop_by_id(d2);
      if (b!==null)
        bsm2.push(b)
    })
    bus_route_manager.add_route(<string>rout.id, bsm1, bsm2);
  });

  const travel_planner = new TravelPlanner(bus_stop_manager, bus_route_manager);

  console.log("##############################################################");
  console.log(`bus_stop_manager stop count: ${bus_stop_manager.stops.length}`);
  console.log(`bus_stop_manager stop count: ${bus_route_manager.routes.length}`);
  console.log("##############################################################");

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  const body = await readBody(event);
  const start_lat = body.start_lat;
  const start_lng = body.start_lng;
  const end_lat = body.end_lat;
  const end_lng = body.end_lng;

  function rad(x: any) {
    return x * Math.PI / 180;
  }

  function getDistance(lat_: any, lng_: any, p2: any)
  {
    const R = 6378137; // Earth’s mean radius in meter
    const dLat = rad(p2.lat - lat_);
    const dLong = rad(p2.lng - lng_);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rad(lat_)) * Math.cos(rad(p2.lat)) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d; // returns the distance in meter
  }

  let busStopList: any = [];
  busStops.forEach( (kangar) => {
    busStopList.push(
        {
          "name": kangar.name,
          "id": kangar.id,
          "lat": kangar.lat,
          "lng": kangar.lng
        }
    );
  });
  async function getNearestBusStop(lat_: any, lng_: any) {
    try {
      let distance_list: any = [];
      busStopList.forEach( (kangar: any) =>{
        distance_list.push({
          id: kangar.id,
          name: kangar.name,
          lng: kangar.lng,
          lat: kangar.lat,
          distance: getDistance(lat_,lng_, kangar)});
      });

      return await distance_list.sort(function(a: any, b: any){return a.distance-b.distance})[0];
    } catch (err) {
      console.dir(err);
      event.node.res.statusCode = 500;
      return {
        code: "ERROR",
        message: "Something went wrong.",
      };
    }
  }

  async function getNearestBusStop1(lat_: any, lng_: any) {
    try {
      let distance_list: any = [];
      busStopList.forEach( (kangar: any) =>{
        distance_list.push({
          id: kangar.id,
          name: kangar.name,
          lng: kangar.lng,
          lat: kangar.lat,
          distance: getDistance(lat_,lng_, kangar)});
      });

      return await distance_list.sort(function(a: any, b: any){return a.distance-b.distance})[1];
    } catch (err) {
      console.dir(err);
      event.node.res.statusCode = 500;
      return {
        code: "ERROR",
        message: "Something went wrong.",
      };
    }
  }

  let dr_start_1 = await getNearestBusStop(start_lat, start_lng);
  let dr_start_2 = await getNearestBusStop1(dr_start_1.lat, dr_start_1.lng);
  let dr_end_1 = await getNearestBusStop(end_lat, end_lng);
  let dr_end_2 = await getNearestBusStop1(dr_end_1.lat, dr_end_1.lng);

  const [optimal_buses_1, optimal_route_1] = travel_planner.find_optimal_route(dr_start_1, dr_end_1);
  const [optimal_buses_2, optimal_route_2] = travel_planner.find_optimal_route(dr_start_2, dr_end_1);
  const [optimal_buses_3, optimal_route_3] = travel_planner.find_optimal_route(dr_start_1, dr_end_2);
  const [optimal_buses_4, optimal_route_4] = travel_planner.find_optimal_route(dr_start_2, dr_end_2);
  const bus_stops_4= [];
  if (optimal_buses_4!==null && optimal_buses_4.length > 1 && optimal_route_4.length > 1 && optimal_buses_4 && optimal_route_4) {
    for (let i = 0; i < optimal_route_4.length; i++) {
      let op_bus = "";
      if (i < optimal_buses_4.length) {
        let ob = optimal_buses_4[i];
        for (let j = 0; j < ob.length; j++) {
          op_bus += optimal_buses_4[i][j].route_number + ", "
        }
      }
      bus_stops_4.push({
        id: optimal_route_4[i].stop_id,
        lat: optimal_route_4[i].latitude,
        lng: optimal_route_4[i].longitude,
        bus: op_bus
      })
      console.log(`Stop: ${optimal_route_4[i].stop_id}, Bus: ${op_bus}`);
    }
  }
  const bus_stops_3 = [];
  if (optimal_buses_3!==null && optimal_buses_3.length > 1 && optimal_route_3.length > 1  && optimal_buses_3 && optimal_route_3) {
    for (let i = 0; i < optimal_route_3.length; i++) {
      let op_bus = "";
      if (i < optimal_buses_3.length) {
        let ob = optimal_buses_3[i];
        for (let j = 0; j < ob.length; j++) {
          op_bus += optimal_buses_3[i][j].route_number + ", "
        }
      }
      bus_stops_3.push({
        id: optimal_route_3[i].stop_id,
        lat: optimal_route_3[i].latitude,
        lng: optimal_route_3[i].longitude,
        bus: op_bus
      })
      console.log(`Stop: ${optimal_route_3[i].stop_id}, Bus: ${op_bus}`);
    }
  }
  const bus_stops_2 = [];
  if (optimal_buses_2!==null && optimal_buses_2.length > 1 && optimal_route_2.length > 1  && optimal_route_2) {
    for (let i = 0; i < optimal_route_2.length; i++) {
      let op_bus = "";
      if (i < optimal_buses_2.length) {
        let ob = optimal_buses_2[i];
        for (let j = 0; j < ob.length; j++) {
          op_bus += optimal_buses_2[i][j].route_number + ", "
        }
      }
      bus_stops_2.push({
        id: optimal_route_2[i].stop_id,
        lat: optimal_route_2[i].latitude,
        lng: optimal_route_2[i].longitude,
        bus: op_bus
      })
      console.log(`Stop: ${optimal_route_2[i].stop_id}, Bus: ${op_bus}`);
    }
  }
  const bus_stops_1 = [];
  if (optimal_buses_1!==null && optimal_buses_1.length > 1 && optimal_route_1.length > 1  && optimal_route_1) {
    for (let i = 0; i < optimal_route_1.length; i++) {
      let op_bus = "";
      if (i < optimal_buses_1.length) {
        let ob = optimal_buses_1[i];
        for (let j = 0; j < ob.length; j++) {
          op_bus += optimal_buses_1[i][j].route_number + ", "
        }
      }
      bus_stops_1.push({
        id: optimal_route_1[i].stop_id,
        lat: optimal_route_1[i].latitude,
        lng: optimal_route_1[i].longitude,
        bus: op_bus
      })
      console.log(`Stop: ${optimal_route_1[i].stop_id}, Bus: ${op_bus}`);
    }
  }
  let dr_start = dr_start_1;
  let dr_end = dr_end_1;

  let bus_stops_ = bus_stops_1;
  bus_stops_ = bus_stops_1;
  dr_start = dr_start_1;
  dr_end = dr_end_1;

  if(bus_stops_2.length < bus_stops_.length) {
    bus_stops_ = bus_stops_2;
    dr_start = dr_start_2;
    dr_end = dr_end_1;
  }
  if(bus_stops_3.length < bus_stops_.length) {
    bus_stops_ = bus_stops_3;
    dr_start = dr_start_1;
    dr_end = dr_end_2;
  }
  if(bus_stops_4.length < bus_stops_.length) {
    bus_stops_ = bus_stops_4;
    dr_start = dr_start_2;
    dr_end = dr_end_2;
  }

  return {
    start_lat: dr_start.lat,
    start_lng: dr_start.lng,
    start_name: dr_start.name,
    start_id: dr_start.id,
    end_lat: dr_end.lat,
    end_lng: dr_end.lng,
    end_name: dr_end.name,
    end_id: dr_end.id,
    busInfo: bus_stops_
  }
})
