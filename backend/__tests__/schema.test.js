const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const fc = require('fast-check');

// Feature: station-map-mvp, Property 1: Station schema validation (round-trip)
// Validates: Requirements 1.1, 1.2

let mongoServer;
let Station;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    Station = require('../src/models/Station');
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Station.deleteMany({});
});

// --- Generators ---

const stationNameArb = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);
const latArb = fc.double({ min: -90, max: 90, noNaN: true, noDefaultInfinity: true });
const lonArb = fc.double({ min: -180, max: 180, noNaN: true, noDefaultInfinity: true });

const dateArb = fc.tuple(
    fc.integer({ min: 2000, max: 2099 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
).map(([y, m, d]) =>
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
);

const s3FileKeyArb = fc.tuple(stationNameArb, dateArb).map(
    ([name, date]) => `stations/${name}/${date}.rnx`
);

const recordArb = fc.tuple(dateArb, s3FileKeyArb).map(([date, s3FileKey]) => ({
    date,
    s3FileKey
}));

const recordsArb = fc.array(recordArb, { minLength: 0, maxLength: 5 });

const validStationArb = fc.tuple(stationNameArb, latArb, lonArb, recordsArb).map(
    ([stationName, lat, lon, records]) => ({
        stationName,
        approxLocation: { lat, lon },
        records
    })
);

describe('Property 1: Station schema validation (round-trip)', () => {
    test('valid station data round-trips through MongoDB', async () => {
        await fc.assert(
            fc.asyncProperty(validStationArb, async (data) => {
                const doc = await Station.create(data);
                const fetched = await Station.findById(doc._id).lean();

                expect(fetched.stationName).toBe(data.stationName);
                expect(fetched.approxLocation.lat).toBeCloseTo(data.approxLocation.lat, 10);
                expect(fetched.approxLocation.lon).toBeCloseTo(data.approxLocation.lon, 10);
                expect(fetched.records).toHaveLength(data.records.length);

                for (let i = 0; i < data.records.length; i++) {
                    expect(fetched.records[i].date).toBe(data.records[i].date);
                    expect(fetched.records[i].s3FileKey).toBe(data.records[i].s3FileKey);
                }

                await Station.deleteOne({ _id: doc._id });
            }),
            { numRuns: 100 }
        );
    });

    test('rejects station missing stationName', async () => {
        await fc.assert(
            fc.asyncProperty(latArb, lonArb, async (lat, lon) => {
                const doc = new Station({
                    approxLocation: { lat, lon },
                    records: []
                });
                await expect(doc.validate()).rejects.toThrow(/stationName/);
            }),
            { numRuns: 100 }
        );
    });

    test('rejects station missing approxLocation.lat', async () => {
        await fc.assert(
            fc.asyncProperty(stationNameArb, lonArb, async (stationName, lon) => {
                const doc = new Station({
                    stationName,
                    approxLocation: { lon },
                    records: []
                });
                await expect(doc.validate()).rejects.toThrow(/lat/);
            }),
            { numRuns: 100 }
        );
    });

    test('rejects station missing approxLocation.lon', async () => {
        await fc.assert(
            fc.asyncProperty(stationNameArb, latArb, async (stationName, lat) => {
                const doc = new Station({
                    stationName,
                    approxLocation: { lat },
                    records: []
                });
                await expect(doc.validate()).rejects.toThrow(/lon/);
            }),
            { numRuns: 100 }
        );
    });

    test('rejects record missing date', async () => {
        await fc.assert(
            fc.asyncProperty(stationNameArb, latArb, lonArb, s3FileKeyArb, async (stationName, lat, lon, s3FileKey) => {
                const doc = new Station({
                    stationName,
                    approxLocation: { lat, lon },
                    records: [{ s3FileKey }]
                });
                await expect(doc.validate()).rejects.toThrow(/date/);
            }),
            { numRuns: 100 }
        );
    });

    test('rejects record missing s3FileKey', async () => {
        await fc.assert(
            fc.asyncProperty(stationNameArb, latArb, lonArb, dateArb, async (stationName, lat, lon, date) => {
                const doc = new Station({
                    stationName,
                    approxLocation: { lat, lon },
                    records: [{ date }]
                });
                await expect(doc.validate()).rejects.toThrow(/s3FileKey/);
            }),
            { numRuns: 100 }
        );
    });
});
