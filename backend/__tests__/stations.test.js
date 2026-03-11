const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');

let mongoServer;
let Station;
let app;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URL = mongoServer.getUri();
    process.env.S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';

    await mongoose.connect(mongoServer.getUri());
    Station = require('../src/models/Station');
    app = require('../src/index').app;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Station.deleteMany({});
});

describe('GET /api/stations', () => {
    test('returns 200 with empty array when no stations exist', async () => {
        const res = await request(app).get('/api/stations');
        expect(res.status).toBe(200);
        expect(res.body).toEqual([]);
    });

    test('returns all stations with only _id, stationName, approxLocation', async () => {
        await Station.create([
            {
                stationName: 'TELA',
                approxLocation: { lat: 32.07, lon: 34.79 },
                records: [{ date: '2024-01-15', s3FileKey: 'stations/TELA/2024-01-15.rnx' }]
            },
            {
                stationName: 'RAMO',
                approxLocation: { lat: 30.60, lon: 34.76 },
                records: [{ date: '2024-02-10', s3FileKey: 'stations/RAMO/2024-02-10.rnx' }]
            }
        ]);

        const res = await request(app).get('/api/stations');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);

        for (const station of res.body) {
            expect(station).toHaveProperty('_id');
            expect(station).toHaveProperty('stationName');
            expect(station).toHaveProperty('approxLocation');
            expect(station.approxLocation).toHaveProperty('lat');
            expect(station.approxLocation).toHaveProperty('lon');
            // records should NOT be included in the projection
            expect(station).not.toHaveProperty('records');
        }
    });

    test('projected fields match stored data', async () => {
        const created = await Station.create({
            stationName: 'KABR',
            approxLocation: { lat: 33.02, lon: 35.07 },
            records: []
        });

        const res = await request(app).get('/api/stations');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].stationName).toBe('KABR');
        expect(res.body[0].approxLocation.lat).toBeCloseTo(33.02);
        expect(res.body[0].approxLocation.lon).toBeCloseTo(35.07);
        expect(res.body[0]._id).toBe(created._id.toString());
    });
});

describe('GET /api/stations/:id', () => {
    test('returns 200 with full station document for valid ID', async () => {
        const created = await Station.create({
            stationName: 'TELA',
            approxLocation: { lat: 32.07, lon: 34.79 },
            records: [
                { date: '2024-01-15', s3FileKey: 'stations/TELA/2024-01-15.rnx' },
                { date: '2024-02-10', s3FileKey: 'stations/TELA/2024-02-10.rnx' }
            ]
        });

        const res = await request(app).get(`/api/stations/${created._id}`);
        expect(res.status).toBe(200);
        expect(res.body._id).toBe(created._id.toString());
        expect(res.body.stationName).toBe('TELA');
        expect(res.body.approxLocation.lat).toBeCloseTo(32.07);
        expect(res.body.approxLocation.lon).toBeCloseTo(34.79);
        expect(res.body.records).toHaveLength(2);
        expect(res.body.records[0]).toEqual({
            date: '2024-01-15',
            s3FileKey: 'stations/TELA/2024-01-15.rnx'
        });
    });

    test('returns 400 for invalid ObjectId format', async () => {
        const res = await request(app).get('/api/stations/not-a-valid-id');
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Invalid station ID format' });
    });

    test('returns 404 for valid ObjectId that does not exist', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app).get(`/api/stations/${fakeId}`);
        expect(res.status).toBe(404);
        expect(res.body).toEqual({ error: 'Station not found' });
    });

    test('returns full records array including s3FileKey', async () => {
        const created = await Station.create({
            stationName: 'RAMO',
            approxLocation: { lat: 30.60, lon: 34.76 },
            records: [{ date: '2024-03-01', s3FileKey: 'stations/RAMO/2024-03-01.rnx' }]
        });

        const res = await request(app).get(`/api/stations/${created._id}`);
        expect(res.status).toBe(200);
        expect(res.body.records).toHaveLength(1);
        expect(res.body.records[0].date).toBe('2024-03-01');
        expect(res.body.records[0].s3FileKey).toBe('stations/RAMO/2024-03-01.rnx');
    });
});

// ---------------------------------------------------------------------------
// Property-Based Tests (fast-check)
// ---------------------------------------------------------------------------
const fc = require('fast-check');

// --- Arbitraries ---

/** Generate a valid station name: 2-6 uppercase letters */
const stationNameArb = fc.stringMatching(/^[A-Z]{2,6}$/);

/** Generate a valid approxLocation within Israel-ish bounds */
const approxLocationArb = fc.record({
    lat: fc.double({ min: 29, max: 34, noNaN: true }),
    lon: fc.double({ min: 34, max: 36, noNaN: true })
});

/** Generate a valid ISO date string (YYYY-MM-DD) */
const isoDateArb = fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31'), noInvalidDate: true })
    .filter(d => !isNaN(d.getTime()))
    .map(d => d.toISOString().slice(0, 10));

/** Generate a valid record */
const recordArb = fc.tuple(stationNameArb, isoDateArb).map(([name, date]) => ({
    date,
    s3FileKey: `stations/${name}/${date}.rnx`
}));

/** Generate a full valid station object */
const stationArb = fc.record({
    stationName: stationNameArb,
    approxLocation: approxLocationArb,
    records: fc.array(recordArb, { minLength: 0, maxLength: 5 })
});

/** Generate a list of 1-5 stations */
const stationListArb = fc.array(stationArb, { minLength: 1, maxLength: 5 });

/** Generate a string that is NOT a valid 24-char hex ObjectId */
const invalidObjectIdArb = fc.oneof(
    fc.stringMatching(/^[a-z0-9]{1,23}$/),                               // too short
    fc.stringMatching(/^[a-z0-9]{25,40}$/),                               // too long
    fc.constant('zzzzzzzzzzzzzzzzzzzzzzzz'),                              // 24 chars but not hex
    fc.stringMatching(/^[g-z]{24}$/)                                      // 24 non-hex chars
).filter(s => s.length > 0 && !(/^[0-9a-fA-F]{24}$/.test(s)));

// --- Property 3 ---
describe('Property 3: GET /api/stations returns all stations with required fields', () => {
    // Feature: station-map-mvp, Property 3: GET /api/stations returns all stations with required fields
    // **Validates: Requirements 3.1**

    it('should return all inserted stations with _id, stationName, approxLocation and no records', async () => {
        await fc.assert(
            fc.asyncProperty(stationListArb, async (stations) => {
                // Clean slate
                await Station.deleteMany({});
                const created = await Station.insertMany(stations);

                const res = await request(app).get('/api/stations');

                expect(res.status).toBe(200);
                expect(res.body).toHaveLength(created.length);

                const returnedIds = res.body.map(s => s._id).sort();
                const createdIds = created.map(s => s._id.toString()).sort();
                expect(returnedIds).toEqual(createdIds);

                for (const s of res.body) {
                    expect(s).toHaveProperty('_id');
                    expect(s).toHaveProperty('stationName');
                    expect(s).toHaveProperty('approxLocation');
                    expect(s.approxLocation).toHaveProperty('lat');
                    expect(s.approxLocation).toHaveProperty('lon');
                    // records must NOT be projected
                    expect(s).not.toHaveProperty('records');
                }
            }),
            { numRuns: 100 }
        );
    });
});

// --- Property 4 ---
describe('Property 4: GET /api/stations/:id round-trip', () => {
    // Feature: station-map-mvp, Property 4: GET /api/stations/:id round-trip
    // **Validates: Requirements 3.2**

    it('should return the full station document matching what was inserted', async () => {
        await fc.assert(
            fc.asyncProperty(stationArb, async (stationData) => {
                await Station.deleteMany({});
                const created = await Station.create(stationData);

                const res = await request(app).get(`/api/stations/${created._id}`);

                expect(res.status).toBe(200);
                expect(res.body._id).toBe(created._id.toString());
                expect(res.body.stationName).toBe(created.stationName);
                expect(res.body.approxLocation.lat).toBeCloseTo(created.approxLocation.lat, 5);
                expect(res.body.approxLocation.lon).toBeCloseTo(created.approxLocation.lon, 5);
                expect(res.body.records).toHaveLength(created.records.length);

                for (let i = 0; i < created.records.length; i++) {
                    expect(res.body.records[i].date).toBe(created.records[i].date);
                    expect(res.body.records[i].s3FileKey).toBe(created.records[i].s3FileKey);
                }
            }),
            { numRuns: 100 }
        );
    });
});

// --- Property 5 ---
describe('Property 5: Non-existent station ID returns 404', () => {
    // Feature: station-map-mvp, Property 5: Non-existent station ID returns 404
    // **Validates: Requirements 3.3**

    it('should return 404 with error field for any valid ObjectId not in the DB', async () => {
        await fc.assert(
            fc.asyncProperty(fc.constant(null), async () => {
                const fakeId = new mongoose.Types.ObjectId();

                const res = await request(app).get(`/api/stations/${fakeId}`);

                expect(res.status).toBe(404);
                expect(res.body).toHaveProperty('error');
            }),
            { numRuns: 100 }
        );
    });
});

// --- Property 15 ---
describe('Property 15: Invalid ObjectId on /api/stations/:id returns 400', () => {
    // Feature: station-map-mvp, Property 15: Invalid ObjectId on /api/stations/:id returns 400
    // **Validates: Requirements 9.1**

    it('should return 400 with error field for any non-ObjectId string', async () => {
        await fc.assert(
            fc.asyncProperty(invalidObjectIdArb, async (badId) => {
                const res = await request(app).get(`/api/stations/${encodeURIComponent(badId)}`);

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            }),
            { numRuns: 100 }
        );
    });
});
