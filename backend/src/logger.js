const pino = require('pino');

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV !== 'production' && !isTest;

// Dev: human-readable colored output with timestamps (via pino-pretty)
// Production: fast JSON output (no transport overhead)
// Test: silent (no transport)
const logger = pino({
    level: process.env.LOG_LEVEL || 'info', // default threshold: info (30)
    transport: isDev
        ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', colorize: true } }
        : undefined,
});

module.exports = logger;
