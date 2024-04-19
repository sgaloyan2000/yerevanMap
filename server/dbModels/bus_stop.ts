import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name:  String,
    AjTeDzax: Boolean,
    lat: Number,
    lng : Number,
    id : Number
  },
  { timestamps: true, strict: true, strictQuery: true }
);
export default mongoose.model("bus_stop", schema, "bus_stop");