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
            stationId: stationId,
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
