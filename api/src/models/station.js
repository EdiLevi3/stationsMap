import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: [Number], required: true },
  }, // [longitude, latitude]
  { timestamps: true },
);

const Station = mongoose.model("Station", stationSchema);

export default Station;
