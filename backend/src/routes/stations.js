// Routes for /api/stations
// GET /     → list all stations (summary fields)
// GET /:id  → get full station details by ID

const express = require('express');
const { getAllStations, getStationById, searchStations } = require('../controllers/stationsController');

const router = express.Router();

router.get('/', getAllStations);
router.get('/search', searchStations);
router.get('/:id', getStationById);

module.exports = router;
