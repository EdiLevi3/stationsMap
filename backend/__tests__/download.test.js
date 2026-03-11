const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const fc = require('fast-check');

// Mock the S3 service before requiring the app
jest.mock('../src/services/s3', () => ({
    generatePresignedUrl: jest.fn().mockResolvedValue('https://s3.example.com/fake-presigned-url')
}));

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

// --- Arbitraries ---

/** Generate a valid station name: 2-6 uppercase letters */
const stationNameArb = fc.stringMatching(/^[A-Z]{2,6}$/);

/** Generate a valid approxLocation within Israel-ish bounds */
const approxLocationArb = fc.record({
    lat: fc.double({ min: 29, max: 34, noNaN: true }),
    lon: fc.double({ min: 34, max: 36, noNaN: true })
});

/** Generate a valid ISO date string (YYYY-MM-DD) */
const isoDateArb = fc.integer({ min: 0, max: 2190 }).map(offset => {
    const d = new Date(2020, 0, 1 + offset);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
});

/** Generate a valid record for a given station name */
const recordArb = fc.tuple(stationNameArb, isoDateArb).map(([name, date]) => ({
    date,
    s3FileKey: `stations/${name}/${date}.rnx`
}));

/** Generate a station with at least one record (needed for Property 6) */
const stationWithRecordsArb = fc.record({
    stationName: stationNameArb,
    approxLocation: approxLocationArb,
    records: fc.array(recordArb, { minLength: 1, maxLength: 5 })
});

// ---------------------------------------------------------------------------
// Property 6: Download endpoint returns pre-signed URL for valid station+date
// ---------------------------------------------------------------------------
describe('Property 6: Download endpoint returns pre-signed URL for valid station+date', () => {
    // Feature: station-map-mvp, Property 6: Download endpoint returns pre-signed URL for valid station+date
    // **Validates: Requirements 4.1**

    it('should return 200 with a non-empty url for any valid station+date combo', async () => {
        await fc.assert(
            fc.asyncProperty(stationWithRecordsArb, async (stationData) => {
                await Station.deleteMany({});
                const created = await Station.create(stationData);

                // Pick a random record from the station
                const recordIndex = Math.floor(Math.random() * created.records.length);
                const record = created.records[recordIndex];

                const res = await request(app)
                    .get('/api/download')
                    .query({ station: created._id.toString(), date: record.date });

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('url');
                expect(typeof res.body.url).toBe('string');
                expect(res.body.url.length).toBeGreaterThan(0);
            }),
            { numRuns: 100 }
        );
    }, 30000);
});

// ---------------------------------------------------------------------------
// Property 7: Download endpoint returns 404 for non-matching station+date
// ---------------------------------------------------------------------------
describe('Property 7: Download endpoint returns 404 for non-matching station+date', () => {
    // Feature: station-map-mvp, Property 7: Download endpoint returns 404 for non-matching station+date
    // **Validates: Requirements 4.2**

    it('should return 404 with error field for a date not in the station records', async () => {
        await fc.assert(
            fc.asyncProperty(
                stationWithRecordsArb,
                isoDateArb,
                async (stationData, randomDate) => {
                    const existingDates = stationData.records.map(r => r.date);
                    fc.pre(!existingDates.includes(randomDate));

                    await Station.deleteMany({});
                    const created = await Station.create(stationData);

                    const res = await request(app)
                        .get('/api/download')
                        .query({ station: created._id.toString(), date: randomDate });

                    expect(res.status).toBe(404);
                    expect(res.body).toHaveProperty('error');
                }
            ),
            { numRuns: 100 }
        );
    }, 30000);
});

// ---------------------------------------------------------------------------
// Property 16: Invalid params on /api/download returns 400
// ---------------------------------------------------------------------------
describe('Property 16: Invalid params on /api/download returns 400', () => {
    // Feature: station-map-mvp, Property 16: Invalid params on /api/download returns 400
    // **Validates: Requirements 9.2**

    /** Generate a string that is NOT a valid 24-char hex ObjectId */
    const invalidObjectIdArb = fc.oneof(
        fc.stringMatching(/^[a-z0-9]{1,23}$/),
        fc.stringMatching(/^[a-z0-9]{25,40}$/),
        fc.constant('zzzzzzzzzzzzzzzzzzzzzzzz'),
        fc.stringMatching(/^[g-z]{24}$/)
    ).filter(s => s.length > 0 && !(/^[0-9a-fA-F]{24}$/.test(s)));

    /** Generate a date string that does NOT match YYYY-MM-DD */
    const invalidDateArb = fc.oneof(
        fc.constant(''),
        fc.constant('15/01/2024'),
        fc.constant('2024-1-15'),
        fc.constant('not-a-date'),
        fc.constant('20240115'),
        fc.stringMatching(/^[a-z]{3,10}$/)
    ).filter(s => !(/^\d{4}-\d{2}-\d{2}$/.test(s)));

    /** A valid ObjectId string for cases where we only want to test invalid date */
    const validObjectIdArb = fc.constant(new mongoose.Types.ObjectId().toString());

    it('should return 400 when station param is invalid ObjectId', async () => {
        await fc.assert(
            fc.asyncProperty(invalidObjectIdArb, isoDateArb, async (badStation, validDate) => {
                const res = await request(app)
                    .get('/api/download')
                    .query({ station: badStation, date: validDate });

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            }),
            { numRuns: 100 }
        );
    }, 30000);

    it('should return 400 when date param is invalid format', async () => {
        await fc.assert(
            fc.asyncProperty(validObjectIdArb, invalidDateArb, async (validStation, badDate) => {
                const res = await request(app)
                    .get('/api/download')
                    .query({ station: validStation, date: badDate });

                expect(res.status).toBe(400);
                expect(res.body).toHaveProperty('error');
            }),
            { numRuns: 100 }
        );
    }, 30000);

    it('should return 400 when station param is missing', async () => {
        const res = await request(app)
            .get('/api/download')
            .query({ date: '2024-01-15' });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when date param is missing', async () => {
        const validStation = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .get('/api/download')
            .query({ station: validStation });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });

    it('should return 400 when both params are missing', async () => {
        const res = await request(app).get('/api/download');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('error');
    });
});
