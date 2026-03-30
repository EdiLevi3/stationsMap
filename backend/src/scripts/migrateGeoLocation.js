// One-time migration: populates the GeoJSON `location` field from `approxLocation`.
// Run with: node src/scripts/migrateGeoLocation.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
    console.error('MONGODB_URL is not set in .env');
    process.exit(1);
}

// Import model after dotenv so the schema's pre-save hook has config available
const Station = require('../models/Station');

const migrate = async () => {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const stations = await Station.find({
        $or: [
            { location: { $exists: false } },
            { 'location.coordinates': { $exists: false } },
        ],
    }).lean();
    console.log(`Found ${stations.length} stations without location field`);

    let updatedCount = 0;
    for (const station of stations) {
        const { lat, lon } = station.approxLocation;
        await Station.updateOne(
            { _id: station._id },
            {
                $set: {
                    location: {
                        type: 'Point',
                        coordinates: [lon, lat], // GeoJSON: [longitude, latitude]
                    },
                },
            }
        );
        updatedCount++;
    }

    console.log(`Updated ${updatedCount} stations`);
    await mongoose.disconnect();
    console.log('Done');
};

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
