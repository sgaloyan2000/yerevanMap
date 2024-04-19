import  bus_stop  from "~/server/dbModels/bus_stop";
export default defineEventHandler(async (event) => {
  //console.log("GET /api/bus_stop");
  try {
    //console.log("Find bus_stop");
    const usersData = await bus_stop.find();
    return usersData.map((bus_stop_) => ({
      id: bus_stop_._id,
      name: bus_stop_.name,
      lat: bus_stop_.lat,
      lng: bus_stop_.lng,
    }));
  } catch (err) {
    console.dir(err);
    event.res.statusCode = 500;
    return {
      code: "ERROR",
      message: "Something went wrong.",
    };
  }
});