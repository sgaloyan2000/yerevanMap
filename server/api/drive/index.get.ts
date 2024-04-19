import  drive  from "~/server/dbModels/drive";
export default defineEventHandler(async (event) => {
  //console.log("GET /api/drive");
  try {
    //console.log("Find rout");
    const routDrive = await drive.find();
    // const mihatarray = [];
    // routDrive.forEach(element => {
    //     mihatarray.push({
    //         id: element.Number,
    //         Dir1: element.Dir1,
    //         Dir2: element.Dir2,
    //       });
    // });
    // return mihatarray;
    return routDrive.map((drive_) => ({
      id: drive_.Number,
      Dir1: drive_.Dir1,
      Dir2: drive_.Dir2,
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