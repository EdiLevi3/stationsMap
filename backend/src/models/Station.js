// Mongoose schema for GNSS stations.
// Records are stored in a separate collection (see Record.js).

const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    approxLocation: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    countrycode: { type: String },
    country: { type: String },
    city: { type: String },
});

// Enforce unique station names
stationSchema.index({ stationName: 1 }, { unique: true });

module.exports = mongoose.model('Station', stationSchema);
