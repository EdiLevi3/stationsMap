// Mongoose schema for RINEX file records.
// Each record belongs to a station (referenced by stationName) and represents one file.

const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    date: { type: String, required: true },
    s3FileKey: { type: String, required: true },
    download_url: { type: String },
});

// Speed up lookups by stationName
recordSchema.index({ stationName: 1 });

// Speed up lookups by stationName + date (used in download endpoint)
recordSchema.index({ stationName: 1, date: 1 });

module.exports = mongoose.model('Record', recordSchema);
