// Migration script: moves embedded records from the stations collection
// into the new separate records collection.
//
// Run once: node scripts/migrateRecords.js
// Safe to re-run — skips stations that have no records array.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URL = process.env.MONGODB_URL;
if (!MONGODB_URL) {
    console.error('Missing MONGODB_URL in .env');
    process.exit(1);
}

const recordSchema = new mongoose.Schema({
    stationName: { type: String, required: true },
    date: { type: String, required: true },
    s3FileKey: { type: String, required: true },
    download_url: { type: String },
});

// Read the raw stations collection without the new Station model
// so we can still access the old `records` field
const rawStationSchema = new mongoose.Schema({}, { strict: false });

const RawStation = mongoose.model('Station', rawStationSchema);
const Record = mongoose.model('Record', recordSchema);

const migrate = async () => {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    const allStations = await RawStation.find({}).lean();
    console.log(`Found ${allStations.length} stations`);

    let totalInserted = 0;

    for (const stationDoc of allStations) {
        if (!stationDoc.records || stationDoc.records.length === 0) continue;

        const recordDocs = stationDoc.records.map((embeddedRecord) => ({
            stationName: stationDoc.stationName,
            date: embeddedRecord.date,
            s3FileKey: embeddedRecord.s3FileKey,
            download_url: embeddedRecord.download_url,
        }));

        await Record.insertMany(recordDocs, { ordered: false });
        totalInserted += recordDocs.length;
        console.log(`  ${stationDoc.stationName}: inserted ${recordDocs.length} records`);
    }

    console.log(`\nMigration complete. Total records inserted: ${totalInserted}`);
    await mongoose.disconnect();
};

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
