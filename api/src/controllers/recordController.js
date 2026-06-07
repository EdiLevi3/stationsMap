import Record from "../models/record.js";
import Station from "../models/station.js";

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

// // const getLastUpdateRecordOfStation = async (req, res) => {
//   try {
//     const { stationName } = req.params;

//     const station = await Station.findOne({
//       name: stationName,
//     }).select("_id");

//     if (!station) {
//       return res.status(404).json({
//         message: `Station '${stationName}' not found`,
//       });
//     }

//     const latestRecord = await Record.findOne({
//       "stations.stationId": station._id,
//     })
//       .sort({ updatedAt: -1 })
//       .select("updatedAt");

//     if (!latestRecord) {
//       return res.status(404).json({
//         message: "No records found for this station",
//       });
//     }

//     return res.json({
//       updatedAt: latestRecord.updatedAt,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       error: err.message,
//     });
//   }
// // };

const saveRecordInMongo = async (recordData) => {
  const {
    date,
    hour,
    stationName,
    valid,
    satelliteConstellation,
    recordPrecent,
    longestSequence,
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
          valid,
          satelliteConstellation,
          recordPrecent,
          longestSequence,
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
      valid,
      satelliteConstellation,
      recordPrecent,
      longestSequence,
    });

    await record.save();
    return record;
  }

  // Update existing station
  existingStation.valid = valid;

  existingStation.recordPrecent += recordPrecent;

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

export {
  createRecord,
  getAllRecords,
  getRecordById,
  replaceRecord,
  updateRecord,
  deleteRecord,
  // getLastUpdateRecordOfStation,
  saveRecordInMongo,
  
};
