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
        recordPrecent: { type: Number, required: true },
    longestSequence: { type: Number, required: true },

    spoofPrecents: {
      type: Number,
      default: 0,
    },

    gamPrecents: {
      type: Number,
      default: 0,
    },
  },

  
  { _id: false },
);

const recordsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    hour: { type: Number, required: true, min: 0, max: 23},
    stations: [stationRecordSchema],
  },
  { timestamps: true },
);

const Record = mongoose.model("Record", recordsSchema);

export default Record;
