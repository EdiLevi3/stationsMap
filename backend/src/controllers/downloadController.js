// Handles RINEX file download requests.
// Looks up the record by station + date and returns a temporary S3 presigned URL.

const Station = require('../models/Station');
const Record = require('../models/Record');
const { generatePresignedUrl } = require('../services/s3');
const logger = require('../logger');

// GET /api/download?station=<id>&date=<YYYY-MM-DD>
const getDownloadUrl = async (req, res) => {
    try {
        const { station: stationId, date } = req.query;

        const station = await Station.findById(stationId, 'stationName').lean();

        if (!station) {
            return res.status(404).json({ error: 'Station not found' });
        }

        const record = await Record.findOne({ stationName: station.stationName, date }).lean();

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
