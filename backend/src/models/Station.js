// Mongoose schema for GNSS stations.
// Each station has a name, location, and an array of RINEX file records.

const mongoose = require('mongoose');

// Sub-document: a single RINEX file record (date + S3 key)
const recordSchema = new mongoose.Schema({
    date: { type: String, required: true },
    s3FileKey: { type: String, required: true },
    download_url: { type: String },
}, { _id: false });

const stationSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    approxLocation: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    countrycode: { type: String },
    country: { type: String },
    city: { type: String },
    records: { type: [recordSchema], default: [] },
});

// Enforce unique station names
stationSchema.index({ stationName: 1 }, { unique: true });

// Speed up lookups by date within a station's records
stationSchema.index({ 'records.date': 1 });

module.exports = mongoose.model('Station', stationSchema);
