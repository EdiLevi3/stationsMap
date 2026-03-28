// Handles requests for station data (list all / get by ID / search)

const mongoose = require('mongoose');
const Fuse = require('fuse.js');
const Station = require('../models/Station');
const Record = require('../models/Record');
const logger = require('../logger');

const STATION_SUMMARY_FIELDS = '_id stationName approxLocation city country countrycode';
const FUSE_INDEX_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FUZZY_SEARCH_RESULTS = 500;
const MIN_SEARCH_QUERY_LENGTH = 2;

let fuseIndex = null;
let fuseIndexBuiltAt = 0;

const buildFuseIndex = async () => {
    const now = Date.now();
    if (fuseIndex && now - fuseIndexBuiltAt < FUSE_INDEX_TTL_MS) return fuseIndex;

    const stations = await Station.find({}, STATION_SUMMARY_FIELDS).lean();
    fuseIndex = new Fuse(stations, {
        keys: ['stationName'],
        threshold: 0.4,
        includeScore: true,
        includeMatches: true,
    });
    fuseIndexBuiltAt = now;
    return fuseIndex;
};

// GET /api/stations — returns all stations with summary fields only (no records)
const getAllStations = async (req, res) => {
    try {
        const stations = await Station.find({}, STATION_SUMMARY_FIELDS).lean();
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

        const records = await Record.find({ stationName: station.stationName }, '-_id -stationName').lean();

        return res.status(200).json({ ...station, records });
    } catch (err) {
        logger.error({ err }, 'Error fetching station by ID');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /api/stations/search?q=... — fuzzy search stations by name
const searchStations = async (req, res) => {
    try {
        const searchQuery = (req.query.q || '').trim();
        if (searchQuery.length < MIN_SEARCH_QUERY_LENGTH) {
            return res.status(200).json([]);
        }
        const searcher = await buildFuseIndex();
        const matchedStations = searcher.search(searchQuery, { limit: MAX_FUZZY_SEARCH_RESULTS });
        return res.status(200).json(matchedStations);
    } catch (err) {
        logger.error({ err }, 'Error searching stations');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getAllStations, getStationById, searchStations };
