import Hour from "../models/hour";

const getHourData = async (req, res) => {
  try {
    const hourData = await Hour.findOne({ hour: req.params.hour });
    if (!hourData) {
      return res.status(404).json({ error: "Hour data not found" });
    }
    res.status(200).json(hourData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getHourDataByDate = async (req, res) => {
  try {
    const hourData = await Hour.findOne({
      hour: req.params.hour,
      date: req.params.date,
    });
    if (!hourData) {
      return res.status(404).json({ error: "Hour data not found" });
    }
    res.status(200).json(hourData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createHour = async (req, res) => {
  try {
    const hourData = await Hour.create(req.body);
    res.status(201).json(hourData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const upsertrecord = async (req, res) => {
  try {
    const { hour, date, stationId } = req.params;
    const recordData = req.body;

    const hourData = await Hour.findOneAndUpdate(
      {
        hour: hour,
        "dateEntries.date": date,
        "dateEntries.stations.stationId": stationId,
      },
      {
        $set: {
          "dateEntries.$[dateEntry].stations.$[station].records": recordData,
        },
      },
      {
        new: true,
        upsert: true,
        arrayFilters: [
          { "dateEntry.date": date },
          { "station.stationId": stationId },
        ],
      },
    );

    res.status(200).json(hourData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteRecord = async (req, res) => {
  try {
    const { hour, date, stationId } = req.params;

    const hourData = await Hour.findOneAndUpdate(
      { hour: hour },
      {
        $pull: {
          "dateEntries.$[dateEntry].stations": { stationId: stationId },
        },
      },
      { new: true, arrayFilters: [{ "dateEntry.date": date }] },
    );

    res.status(200).json(hourData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createRecord = async (req, res) => {
  try {
    const { hour, date, stationId } = req.params;
    const recordData = req.body;

    // Step 1: Ensure the 'Hour' document exists and contains the specific 'date' entry.
    // If the hour doesn't exist, 'upsert' creates it.
    // If the date doesn't exist in 'dateEntries', we push a new empty date entry.
    await Hour.findOneAndUpdate(
      { hour: hour, "dateEntries.date": { $ne: date } },
      {
        $push: { dateEntries: { date: date, stations: [] } },
      },
      { upsert: true },
    );

    // Step 2: Now that we are certain the date exists, push the station record.
    // We use '$push' and check if stationId already exists to prevent duplicates.
    const hourData = await Hour.findOneAndUpdate(
      {
        hour: hour,
        "dateEntries.date": date,
        "dateEntries.stations.stationId": { $ne: stationId },
      },
      {
        $push: {
          "dateEntries.$.stations": {
            stationId: stationId,
            records: recordData,
          },
        },
      },
      { new: true },
    );

    if (!hourData) {
      return res
        .status(409)
        .json({ error: "Record for this station and date already exists." });
    }

    res.status(201).json(hourData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
