import Record from "../models/record";

// const getHourData = async (req, res) => {
//   try {
//     const hourData = await Hour.findOne({ hour: req.params.hour });
//     if (!hourData) {
//       return res.status(404).json({ error: "Hour data not found" });
//     }
//     res.status(200).json(hourData);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const getHourDataByDate = async (req, res) => {
//   try {
//     const hourData = await Hour.findOne({
//       hour: req.params.hour,
//       date: req.params.date,
//     });
//     if (!hourData) {
//       return res.status(404).json({ error: "Hour data not found" });
//     }
//     res.status(200).json(hourData);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const createHour = async (req, res) => {
//   try {
//     const hourData = await Hour.create(req.body);
//     res.status(201).json(hourData);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const upsertrecord = async (req, res) => {
//   try {
//     const { hour, date, stationId } = req.params;
//     const recordData = req.body;

//     const hourData = await Hour.findOneAndUpdate(
//       {
//         hour: hour,
//         "dateEntries.date": date,
//         "dateEntries.stations.stationId": stationId,
//       },
//       {
//         $set: {
//           "dateEntries.$[dateEntry].stations.$[station].records": recordData,
//         },
//       },
//       {
//         new: true,
//         upsert: true,
//         arrayFilters: [
//           { "dateEntry.date": date },
//           { "station.stationId": stationId },
//         ],
//       },
//     );
//     if (!hourData) {
//       return res.status(404).json({
//         error: "Record not found",
//       });
//     }

//     res.status(200).json(hourData);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const deleteRecord = async (req, res) => {
//   try {
//     const { hour, date, stationId } = req.params;

//     const hourData = await Hour.findOneAndUpdate(
//       { hour: hour },
//       {
//         $pull: {
//           "dateEntries.$[dateEntry].stations": { stationId: stationId },
//         },
//       },
//       { new: true, arrayFilters: [{ "dateEntry.date": date }] },
//     );

//     res.status(200).json(hourData);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const createRecord = async (req, res) => {
//   try {
//     const { hour, date, stationId } = req.params;
//     const recordData = req.body;

//     let hourData = await Hour.findOne({ hour: hour });

//     if (!hourData) {
//       hourData = await Hour.create({ hour: hour, dateEntries: [] });
//     }

//     let dateObj = hourData.dateEntries.find(
//       (d) => d.date.toISOString().split("T")[0] === date,
//     );

//     if (!dateObj) {
//       dateObj = {
//         date,
//         stations: [],
//       };
//       hourData.dateEntries.push(dateObj);
//     }

//     const stationExists = dateObj.stations.find(
//       (s) => s.stationId.toString() === stationId,
//     );

//     if (stationExists) {
//       return res
//         .status(409)
//         .json({ error: "Record for this station and date already exists." });
//     }

//     dateObj.stations.push({
//       stationId,
//       records: recordData,
//     });

//     await hourData.save();
//     res
//       .status(201)
//       .json({ message: "Record created successfully", data: hourData });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// const getRecordByStation = async (req, res) => {
//   try {
//     const { hour, date, stationId } = req.params;
//     const hourData = await Hour.findOne({ hour: hour });
//     if (!hourData) {
//       return res.status(404).json({ error: "Hour data not found" });
//     }

//     const dateEntry = hourData.dateEntries.find(
//       (d) => d.date.toISOString().split("T")[0] === date,
//     );
//     if (!dateEntry) {
//       return res.status(404).json({ error: "Date entry not found" });
//     }

//     const stationEntry = dateEntry.stations.find(
//       (s) => s.stationId.toString() === stationId,
//     );
//     if (!stationEntry) {
//       return res.status(404).json({ error: "Station entry not found" });
//     }

//     res.status(200).json(stationEntry.records);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

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

const saveRecordInMongo = async (recordData) => {
  try {
    const {
      date,
      hour,
      stationName,
      valid,
      satelliteConstellation,
      recordPrecent,
      longestSequence,
    } = recordData;

    const stationId = await Station.findOne({ name: stationName }).select(
      "_id",
    );

    if (!stationId) {
      return res
        .status(404)
        .json({ error: `Station with name ${stationName} not found.` });
    }

    await Record.findOneAndUpdate(
      {
        date: new Date(date),
        hour,
      },
      {
        $push: {
          stations: {
            stationId: station._id,
            valid,
            satelliteConstellation,
            recordPrecent,
            longestSequence,
          },
        },
        $setOnInsert: {
          date: new Date(date),
          hour,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  createRecord,
  getAllRecords,
  getRecordById,
  replaceRecord,
  updateRecord,
  deleteRecord,
  saveRecordInMongo,
};
