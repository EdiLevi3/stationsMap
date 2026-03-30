// Mongoose schema for GNSS stations.
// Records are stored in a separate collection (see Record.js).

const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    approxLocation: {
        lat: { type: Number, required: true },
        lon: { type: Number, required: true },
    },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] }, // [lon, lat]
    },
    countrycode: { type: String },
    country: { type: String },
    city: { type: String },
});

// Auto-populate GeoJSON location from approxLocation before saving
stationSchema.pre('save', function (next) {
    if (this.approxLocation && this.approxLocation.lat != null && this.approxLocation.lon != null) {
        this.location = {
            type: 'Point',
            coordinates: [this.approxLocation.lon, this.approxLocation.lat],
        };
    }
    next();
});

// Enforce unique station names
stationSchema.index({ stationName: 1 }, { unique: true });

// Enable geospatial queries (nearby, within radius, etc.)
stationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Station', stationSchema);
