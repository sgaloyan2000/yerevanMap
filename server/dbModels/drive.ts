import mongoose from "mongoose";

const newSchema = new mongoose.Schema(
  {
    "id": String,
    Dir1: [Number],
    Dir2: [Number]
  },
  { timestamps: true, strict: true, strictQuery: true }
);

export default mongoose.model("drive", newSchema, "drive");