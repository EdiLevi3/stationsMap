import mongoose from "mongoose";

const stationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    frequency: {
      type: Number,
      required: true, // remove if optional
    },

    antenna: {
      type: String,
      required: true, // remove if optional
      trim: true,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },

      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  { timestamps: true }
);

stationSchema.index({ location: "2dsphere" });

const Station = mongoose.model("Station", stationSchema);

export default Station;