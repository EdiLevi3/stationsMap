const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Returns Express middleware that validates req.params[paramName]
 * is a valid 24-character hex MongoDB ObjectId.
 */
const validateObjectId = (paramName) => (req, res, next) => {
    const value = req.params[paramName];
    if (!OBJECT_ID_REGEX.test(value)) {
        return res.status(400).json({ error: 'Invalid station ID format' });
    }
    next();
};

/**
 * Express middleware that validates the `station` and `date` query
 * parameters required by the download endpoint.
 */
const validateDownloadParams = (req, res, next) => {
    const { station, date } = req.query;

    if (!station||!date) {
        return res.status(400).json({ error: 'Missing required parameter: station' });
    }

    if (!date) {
        return res.status(400).json({ error: 'Missing required parameter: date' });
    }

    if (!OBJECT_ID_REGEX.test(station)) {
        return res.status(400).json({ error: 'Invalid station ID format' });
    }

    if (!DATE_REGEX.test(date)) {
        return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    const [year, month, day] = date.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
        return res.status(400).json({ error: 'Invalid date. The provided date does not exist' });
    }

    next();
};

module.exports = { validateObjectId, validateDownloadParams };
