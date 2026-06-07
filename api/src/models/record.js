import mongoose from "mongoose";

const stationRecordSchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    valid: { type: Boolean, required: true },
satelliteConstellation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      required: true,
    },
        recordPrecent: { type: Number, required: true },
    longestSequence: { type: Number, required: true },
  },
  { _id: false },
);

const recordsSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    hour: { type: Number, required: true, min: 0, max: 23, unique: true },
    stations: [stationRecordSchema],
  },
  { timestamps: true },
);

const Record = mongoose.model("Record", recordsSchema);

export default Record;
