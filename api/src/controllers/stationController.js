import Station from "../models/station.js";
import Record from "../models/record.js"
import mongoose from "mongoose";


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

    const stationsWithUpdates = await Promise.all(
      stations.map(async (station) => {
        const latestRecord = await Record.findOne({
          "stations.stationId": station._id,
        }).sort({ updatedAt: -1 });

        return {
          ...station.toObject(),
          lastUpdate: latestRecord?.updatedAt || null,
        };
      })
    );

    res.status(200).json(stationsWithUpdates);
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
    console.log("station._id =", station._id);
    const latestRecord = await Record.findOne({
      "stations.stationId": station._id,   // ✅ IMPORTANT FIX
    }).sort({ updatedAt: -1 });

    console.log("latestRecord:", latestRecord);

    res.status(200).json({
      ...station.toObject(),
      lastUpdate: latestRecord?.updatedAt || null,
    });
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
      { new: true },
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

const searchStations = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: "Query parameter 'q' is required",
      });
    }

    // 1. Detect coordinates: "lon,lat" or "lat,lon"
    const coordMatch = q.match(/^\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*$/);

    if (coordMatch) {
      const lon = parseFloat(coordMatch[1]);
      const lat = parseFloat(coordMatch[2]);

      // Mongo geospatial search (requires 2dsphere index)
      const stations = await Station.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lon, lat],
            },
            $maxDistance: 5000, // 5km radius (adjust as needed)
          },
        },
      });

      return res.status(200).json(stations);
    }

    // 2. Name search
    const stations = await Station.find({
      name: { $regex: q, $options: "i" },
    });

    return res.status(200).json(stations);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
const getNearbyStations = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const limit = parseInt(req.query.limit, 10) || 3;

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "Invalid lat/lon parameters" });
    }

    const stations = await Station.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lon, lat] },
          distanceField: "distanceMeters",
          spherical: true,
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          name: 1,
          location: 1,
          distanceMeters: { $round: ["$distanceMeters", 0] },
        },
      },
    ]);

    return res.status(200).json(stations);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export {
  createStation,
  getAllStations,
  getStationById,
  updateStation,
  deleteStation,
  searchStations,
  getNearbyStations,
};
