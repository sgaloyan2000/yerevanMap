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
    stops: BusStop[];

    constructor(route_number: string, stops: BusStop[]) {
      this.route_number = route_number;
      this.stops = stops;
    }
  }

  class BusRouteManager {
    routes: BusRoute[];

    constructor() {
      this.routes = [];
    }

    add_route(route_number: string, stops: BusStop[]) {
      const route = new BusRoute(route_number, stops);
      this.routes.push(route);
    }

    find_stops_by_route(route_number: string): BusStop[] | null {
      const route = this.routes.find(route => route.route_number === route_number);
      return route ? route.stops : null;
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

    find_stop_by_id(stop_id: number): BusStop | null {
      return this.stops.find(stop => stop.stop_id === stop_id) || null;
    }

    find_stop_by_name(name: string): BusStop | null {
      return this.stops.find(stop => stop.name.toLowerCase() === name.toLowerCase()) || null;
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

    find_optimal_route(start_stop_name: string, end_stop_name: string): [string[][], BusStop[]] | [null, null] {
      const start_stop = this.bus_stop_manager.find_stop_by_name(start_stop_name);
      const end_stop = this.bus_stop_manager.find_stop_by_name(end_stop_name);

      if (!start_stop || !end_stop) {
        return [null, null];
      }

      const distances: { [key: string]: number } = {};
      distances[start_stop_name] = 0;
      const pq: [number, BusStop][] = [[0, start_stop]];
      const previous_stop: { [key: string]: BusStop | undefined } = {};

      while (pq.length) {
        const [current_distance, current_stop] = pq.shift()!;
        if (current_stop === end_stop) {
          break;
        }

        const neighbors = this.get_neighbors(current_stop);
        for (const neighbor_stop of neighbors) {
          const distance = current_distance + this.bus_stop_manager.calculate_distance(
              current_stop.latitude, current_stop.longitude,
              neighbor_stop.latitude, neighbor_stop.longitude
          );
          if (distance < (distances[neighbor_stop.name] || Infinity)) {
            distances[neighbor_stop.name] = distance;
            previous_stop[neighbor_stop.name] = current_stop;
            pq.push([distance, neighbor_stop]);
            pq.sort((a, b) => a[0] - b[0]);
          }
        }
      }

      let optimal_route: BusStop[] = [];
      let current: BusStop | undefined = end_stop;

      if (current) {
        while (current !== start_stop) {
          if (!current) break; // Break if current is undefined

          optimal_route.unshift(current);
          current = previous_stop[current.name];
        }
        if (current === start_stop) {
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
        if (route.stops.includes(stop)) {
          const index = route.stops.indexOf(stop);
          if (index > 0) {
            neighbors.push(route.stops[index - 1]);
          }
          if (index < route.stops.length - 1) {
            neighbors.push(route.stops[index + 1]);
          }
        }
      }
      return neighbors;
    }

    find_buses_between_stops(stop1: BusStop, stop2: BusStop): string[] {
      const buses: string[] = [];
      for (const route of this.bus_route_manager.routes) {
        if (route.stops.includes(stop1) && route.stops.includes(stop2)) {
          buses.push(route.route_number);
        }
      }
      return buses;
    }
  }

  const bus_stop_manager = new BusStopManager();
  const bus_route_manager = new BusRouteManager();
  const travel_planner = new TravelPlanner(bus_stop_manager, bus_route_manager);

// Add bus stops
  const busStops = await bus_stop.find();
  busStops.forEach( (bs) => {
    bus_stop_manager.add_stop(<number>bs.id, <string>bs.name, <number>bs.lat, <number>bs.lng);
  });

// Add bus routes
  const busRouts = await drive.find();
  busRouts.forEach( (rout) => {
    let bsm1: BusStop[] = [];
    let bsm2: BusStop[] = [];
    rout.Dir1.forEach( (d1) => {
      bsm1.push(bus_stop_manager.stops[d1])
    })
    bus_route_manager.add_route(<string>rout.Number+"_up", bsm1);
    rout.Dir2.forEach( (d2) => {
      bsm2.push(bus_stop_manager.stops[d2])
    })
    bus_route_manager.add_route(<string>rout.Number+"_dn", bsm2);
  });

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

  const dr_start = await getNearestBusStop(start_lat, start_lng);
  const dr_end = await getNearestBusStop(end_lat, end_lng);

  const [optimal_buses, optimal_route] = travel_planner.find_optimal_route(dr_start.name, dr_end.name);
  const bus_stops_ = [];
  if (optimal_buses && optimal_route) {
    for (let i = 0; i < optimal_route.length; i++) {
      let op_bus = "";
      if (i < optimal_buses.length) {
        let ob = optimal_buses[i];
        for (let j = 0; j < ob.length; j++) {
          op_bus += optimal_buses[i][j] + ", "
        }
      }
      bus_stops_.push(`Stop: ${optimal_route[i].name}, Bus: ${op_bus}`)
      console.log(`Stop: ${optimal_route[i].name}, Bus: ${op_bus}`);
    }
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
