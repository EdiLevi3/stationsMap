import Record from "../models/record.js";
import Station from "../models/station.js";
import mongoose from "mongoose";

const createRecord = async (req, res) => {
  try {
    const recordData = req.body;
    const newRecord = await Record.create(recordData);
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRecords = async (req, res) => {
  try {
    const records = await Record.find();
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecordById = async (req, res) => {
  try {
    const record = await Record.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const replaceRecord = async (req, res) => {
  try {
    const updatedRecord = await Record.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, overwrite: true, runValidators: true },
    );
    if (!updatedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateRecord = async (req, res) => {
  try {
    const updatedRecord = await Record.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true },
    );
    if (!updatedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(200).json(updatedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const deletedRecord = await Record.findByIdAndDelete(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllRecordsByStation = async (req, res) => {
  try {
    const { stationId } = req.params;

    const records = await Record.find({
      "stations.stationId": new mongoose.Types.ObjectId(stationId),
    }).sort({ date: 1, hour: 1 });

    console.log("records:", records)

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveRecordInMongo = async (recordData) => {
  const {
    date,
    hour,
    stationName,
    satelliteConstellation,
    recordPrecent,
    longestSequence,
    spoofPrecents,
    gemPrecents,
  } = recordData;

  const station = await Station.findOne({
    name: stationName,
  }).select("_id");

  if (!station) {
    throw new Error(
      `Station with name ${stationName} not found`
    );
  }

  const recordDate = new Date(date);

  let record = await Record.findOne({
    date: recordDate,
    hour,
  });

  // Create date/hour document if it doesn't exist
  if (!record) {
    return await Record.create({
      date: recordDate,
      hour,
      stations: [
        {
          stationId: station._id,
          satelliteConstellation,
          recordPrecent,
          longestSequence,
          spoofPrecents,
          gemPrecents,
        },
      ],
    });
  }

  const existingStation = record.stations.find(
    (s) => s.stationId.toString() === station._id.toString()
  );

  // Add station if it doesn't exist
  if (!existingStation) {
    record.stations.push({
      stationId: station._id,
      satelliteConstellation,
      recordPrecent,
      longestSequence,
      spoofPrecents,
      gemPrecents,
    });

    await record.save();
    return record;
  }

  // Update existing station

  existingStation.recordPrecent += recordPrecent;
  existingStation.spoofPrecents += spoofPrecents;
  existingStation.gemPrecents += gemPrecents;
  existingStation.longestSequence = Math.max(
    existingStation.longestSequence,
    longestSequence
  );

  // Merge satellite constellations
  const existingConstellation =
    existingStation.satelliteConstellation || {};

  for (const [system, satellites] of Object.entries(
    satelliteConstellation || {}
  )) {
    if (!existingConstellation[system]) {
      existingConstellation[system] = {};
    }

    for (const [satellite, value] of Object.entries(
      satellites
    )) {
      if (
        existingConstellation[system][satellite] === undefined
      ) {
        existingConstellation[system][satellite] = value;
      }
    }
  }

  existingStation.satelliteConstellation =
    existingConstellation;

  // Required because Mixed type changes may not be detected
  existingStation.markModified?.("satelliteConstellation");
  record.markModified("stations");

  await record.save();

  return record;
};

const getStationDayRecords = async (req, res) => {
  try {
    const { stationId, date } = req.params;

    const start = new Date(date);
    const end = new Date(date);

    // move to next day (for full 24h range)
    end.setDate(end.getDate() + 1);

    const records = await Record.find({
      date: {
        $gte: start,
        $lt: end,
      },
      "stations.stationId": stationId,
    }).sort({ hour: 1 });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


const getStationHourRecords = async (req, res) => {
  try {
    const { stationId, date, hour } = req.params;

    const recordDoc = await Record.findOne({ date: new Date(date), hour: Number(hour) });
    if (!recordDoc) return res.status(404).json({ message: "Record not found" });

    const stationData = recordDoc.stations.find(s => s.stationId.toString() === stationId);
    if (!stationData) return res.status(404).json({ message: "Station not found" });

    return res.status(200).json(stationData);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};


export {
  createRecord,
  getAllRecords,
  getRecordById,
  replaceRecord,
  updateRecord,
  deleteRecord,
  getAllRecordsByStation,
  saveRecordInMongo,
  getStationDayRecords,
  getStationHourRecords
  
};
