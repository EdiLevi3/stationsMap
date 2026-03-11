// Handles RINEX file download requests.
// Looks up the station record by date and returns a temporary S3 presigned URL.

const Station = require('../models/Station');
const { generatePresignedUrl } = require('../services/s3');
const logger = require('../logger');

// GET /api/download?station=<id>&date=<YYYY-MM-DD>
const getDownloadUrl = async (req, res) => {
    try {
        const { station: stationId, date } = req.query;

        const station = await Station.findById(stationId).lean();

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        // Find the record matching the requested date
        const record = station.records.find((stationRecord) => stationRecord.date === date);

        if (!record) {
            return res.status(404).json({ error: 'No file found for the given station and date' });
        }

        const url = await generatePresignedUrl(record.s3FileKey);
        return res.status(200).json({ url });
    } catch (err) {
        logger.error({ err }, 'Error generating download URL');
        return res.status(500).json({ error: 'Failed to generate download URL' });
    }
};

module.exports = { getDownloadUrl };
