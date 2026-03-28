// Routes for /api/geocode
// GET /?q=... → geocode a place name via Nominatim

const express = require('express');
const { geocode } = require('../controllers/geocodeController');

const router = express.Router();

router.get('/', geocode);

module.exports = router;
