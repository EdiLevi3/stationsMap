import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    valid: { type: Boolean, required: true },
    satelliteConstellation: { type: Number, required: true },
    recordPrecent: { type: Map, of: Number, required: true },
    longestSequence: { type: Number, required: true },
  },
  { _id: false },
);

const stationEntrySchema = new mongoose.Schema(
  {
    stationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    records: recordSchema,
  },
  { _id: false },
);

const dateEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    stations: [stationEntrySchema],
  },
  { _id: false },
);

const hourSchema = new mongoose.Schema(
  {
    hour: { type: Number, required: true, min: 0, max: 23, unique: true },
    dateEntries: [dateEntrySchema],
  },
  { timestamps: true },
);

const Hour = mongoose.model("Hour", hourSchema);

export default Hour;
