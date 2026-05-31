import Station from "../models/station";

const createStation = async (req, res) => {
  try {
    const { name, location } = req.body;
    const station = await Station.create({ name, location });
    res.status(201).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllStations = async (req, res) => {
  try {
    const stations = await Station.find();
    res.status(200).json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.status(200).json(station);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStation = async (req, res) => {
  try {
    const { name, location } = req.body;
    const station = await Station.findByIdAndUpdate(
      req.params.id,
      { name, location },
      { new: true }
    );
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.status(200).json(station);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) {
      return res.status(404).json({ error: "Station not found" });
    }
    res.status(200).json({ message: "Station deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { createStation, getAllStations, getStationById, updateStation, deleteStation }; 