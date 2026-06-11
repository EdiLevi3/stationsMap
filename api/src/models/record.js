import mongoose from "mongoose";

const stationRecordSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    satelliteConstellation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      required: true,
    },
    recordPrecent: { 
      type: Number, 
      required: true,
      min: 0,       // Cannot be less than 0%
      max: 100      // Cannot be more than 100%
    },
    longestSequence: { type: Number, required: true },

    spoofPrecents: {
      type: Number,
      enum: [0, 100], // Strictly allows ONLY 0 or 100
      default: 0,
    },

    jamPrecents: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const recordsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    hour: { type: Number, required: true, min: 0, max: 23 },
    stations: [stationRecordSchema],
  },
  { timestamps: true },
);

const Record = mongoose.model("Record", recordsSchema);

export default Record;