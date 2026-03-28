// Handles geocoding requests via coordinate parsing and OpenStreetMap Nominatim API

const config = require('../config');
const logger = require('../logger');
const { parseLocationToLatLon } = require('../utils/parseLocation');

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const MAX_NOMINATIM_RESULTS = 5;
const MIN_GEOCODE_QUERY_LENGTH = 2;
const NOMINATIM_TIMEOUT_MS = 5000;

// GET /api/geocode?q=... — try coordinate/UTM parsing first, then fall back to Nominatim
const geocode = async (req, res) => {
    try {
        const searchQuery = (req.query.q || '').trim();
        if (searchQuery.length < MIN_GEOCODE_QUERY_LENGTH) {
            return res.status(200).json([]);
        }

        // Try parsing as coordinates (lat/lon or UTM) first — no external call needed
        const parsedLocation = parseLocationToLatLon(searchQuery);
        if (parsedLocation) {
            return res.status(200).json([{
                placeId: 'parsed-coordinates',
                displayName: `${parsedLocation.lat.toFixed(5)}, ${parsedLocation.lon.toFixed(5)}`,
                lat: parsedLocation.lat,
                lon: parsedLocation.lon,
            }]);
        }

        // Fall back to Nominatim geocoding
        if (config.DISABLE_NOMINATIM) {
            return res.status(200).json([]);
        }

        const params = new URLSearchParams({
            q: searchQuery,
            format: 'json',
            limit: String(MAX_NOMINATIM_RESULTS),
            addressdetails: '1',
        });

        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), NOMINATIM_TIMEOUT_MS);

        try {
            const nominatimResponse = await fetch(`${NOMINATIM_BASE_URL}?${params}`, {
                headers: { 'Accept-Language': 'en' },
                signal: abortController.signal,
            });

            if (!nominatimResponse.ok) {
                logger.warn({ status: nominatimResponse.status }, 'Nominatim API returned non-OK status');
                return res.status(200).json([]);
            }

            const nominatimData = await nominatimResponse.json();
            const places = nominatimData.map((place) => ({
                placeId: place.place_id,
                displayName: place.display_name.split(',').slice(0, 2).join(','),
                lat: parseFloat(place.lat),
                lon: parseFloat(place.lon),
            }));

            return res.status(200).json(places);
        } finally {
            clearTimeout(timeout);
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            logger.warn('Nominatim request timed out');
            return res.status(200).json([]);
        }
        logger.error({ err }, 'Error geocoding query');
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { geocode };
