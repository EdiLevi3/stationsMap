const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

describe('config.js — environment variable validation', () => {
    const originalEnv = process.env;
    const originalExit = process.exit;
    const originalError = console.error;

    beforeEach(() => {
        process.env = { ...originalEnv };
        jest.resetModules();
    });

    afterEach(() => {
        process.exit = originalExit;
        console.error = originalError;
    });

    test('exports validated config when all required vars are set', () => {
        process.env.MONGODB_URL = 'mongodb://localhost:27017/test';
        process.env.S3_BUCKET_NAME = 'my-bucket';
        process.env.AWS_REGION = 'us-east-1';
        process.env.PORT = '3000';

        const config = require('../src/config');

        expect(config.MONGODB_URL).toBe('mongodb://localhost:27017/test');
        expect(config.S3_BUCKET_NAME).toBe('my-bucket');
        expect(config.AWS_REGION).toBe('us-east-1');
        expect(config.PORT).toBe(3000);
    });

    test('PORT defaults to 5004 when not set', () => {
        process.env.MONGODB_URL = 'mongodb://localhost:27017/test';
        process.env.S3_BUCKET_NAME = 'my-bucket';
        process.env.AWS_REGION = 'us-east-1';
        delete process.env.PORT;

        const config = require('../src/config');

        expect(config.PORT).toBe(5004);
    });

    test('exits with code 1 when MONGODB_URL is missing', () => {
        delete process.env.MONGODB_URL;
        process.env.S3_BUCKET_NAME = 'my-bucket';
        process.env.AWS_REGION = 'us-east-1';

        let exitCode;
        process.exit = (code) => { exitCode = code; throw new Error('process.exit'); };
        console.error = jest.fn();

        expect(() => require('../src/config')).toThrow('process.exit');
        expect(exitCode).toBe(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('MONGODB_URL')
        );
    });

    test('exits with code 1 when S3_BUCKET_NAME is missing', () => {
        process.env.MONGODB_URL = 'mongodb://localhost:27017/test';
        delete process.env.S3_BUCKET_NAME;
        process.env.AWS_REGION = 'us-east-1';

        let exitCode;
        process.exit = (code) => { exitCode = code; throw new Error('process.exit'); };
        console.error = jest.fn();

        expect(() => require('../src/config')).toThrow('process.exit');
        expect(exitCode).toBe(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('S3_BUCKET_NAME')
        );
    });

    test('exits with code 1 when AWS_REGION is missing', () => {
        process.env.MONGODB_URL = 'mongodb://localhost:27017/test';
        process.env.S3_BUCKET_NAME = 'my-bucket';
        delete process.env.AWS_REGION;

        let exitCode;
        process.exit = (code) => { exitCode = code; throw new Error('process.exit'); };
        console.error = jest.fn();

        expect(() => require('../src/config')).toThrow('process.exit');
        expect(exitCode).toBe(1);
        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining('AWS_REGION')
        );
    });

    test('exits with code 1 and lists all missing vars when multiple are missing', () => {
        delete process.env.MONGODB_URL;
        delete process.env.S3_BUCKET_NAME;
        delete process.env.AWS_REGION;

        let exitCode;
        process.exit = (code) => { exitCode = code; throw new Error('process.exit'); };
        console.error = jest.fn();

        expect(() => require('../src/config')).toThrow('process.exit');
        expect(exitCode).toBe(1);
        const errorMsg = console.error.mock.calls[0][0];
        expect(errorMsg).toContain('MONGODB_URL');
        expect(errorMsg).toContain('S3_BUCKET_NAME');
        expect(errorMsg).toContain('AWS_REGION');
    });
});

describe('mongoDb/connection.js — MongoDB connection', () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(() => {
        jest.resetModules();
    });

    test('connectMongoDB connects successfully to a valid MongoDB URI', async () => {
        process.env.MONGODB_URL = mongoServer.getUri();
        process.env.S3_BUCKET_NAME = 'test-bucket';
        process.env.AWS_REGION = 'us-east-1';

        // Disconnect first in case already connected
        await mongoose.disconnect();

        const connectMongoDB = require('../src/mongoDb/connection');
        await connectMongoDB();

        // Require mongoose from the same module cache used by connectMongoDB
        const mongooseInstance = require('mongoose');
        expect(mongooseInstance.connection.readyState).toBe(1); // 1 = connected
    });

    test('connectMongoDB exits with code 1 on invalid URI', async () => {
        await mongoose.disconnect();

        const originalExit = process.exit;
        let exitCode;
        process.exit = (code) => { exitCode = code; throw new Error('process.exit'); };

        // Point to a non-existent server with short timeout
        process.env.MONGODB_URL = 'mongodb://invalid-host:99999/test';
        process.env.S3_BUCKET_NAME = 'test-bucket';
        process.env.AWS_REGION = 'us-east-1';

        jest.resetModules();

        // Override mongoose connect to simulate failure
        jest.doMock('mongoose', () => ({
            connect: jest.fn().mockRejectedValue(new Error('connection failed')),
        }));

        // Mock the logger so pino doesn't interfere
        const mockLogger = { info: jest.fn(), error: jest.fn(), warn: jest.fn() };
        jest.doMock('../src/logger', () => mockLogger);

        const connectMongoDB = require('../src/mongoDb/connection');

        await expect(connectMongoDB()).rejects.toThrow('process.exit');
        expect(exitCode).toBe(1);
        expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({ err: expect.any(Error) }),
            'MongoDB connection error'
        );

        process.exit = originalExit;
    });
});
