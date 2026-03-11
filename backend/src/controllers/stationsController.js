// Handles requests for station data (list all / get by ID)

const mongoose = require('mongoose');
const Station = require('../models/Station');
const logger = require('../logger');

// GET /api/stations — returns all stations with summary fields only (no records)
const getAllStations = async (req, res) => {
    try {
        const stations = await Station.find({}, '_id stationName approxLocation city country countrycode').lean();
        return res.status(200).json(stations);
    } catch (err) {
        logger.error({ err }, 'Error fetching stations');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/stations/:id — returns full station details including records
const getStationById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid station ID format' });
        }

        const station = await Station.findById(id).lean();

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        return res.status(200).json(station);
    } catch (err) {
        logger.error({ err }, 'Error fetching station by ID');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getAllStations, getStationById };
