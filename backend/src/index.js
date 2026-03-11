// Express application entry point.
// Sets up middleware, routes, and graceful shutdown handling.

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const config = require('./config');
const connectMongoDB = require('./mongoDb/connection');
const logger = require('./logger');
const stationsRouter = require('./routes/stations');
const downloadRouter = require('./routes/download');

const app = express();

// Middleware: CORS restricted to allowed origins, gzip responses, parse JSON bodies
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({ origin: allowedOrigins }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Rate limiting: max 100 requests per 15 minutes per IP (disabled in tests)
if (process.env.NODE_ENV !== 'test') {
    app.use('/api/', rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests, please try again later' },
    }));
}

// Health check endpoint — used by Docker healthcheck to verify the service is up
app.get('/health', (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    if (dbReady) {
        return res.status(200).json({ status: 'ok' });
    }
    return res.status(503).json({ status: 'unavailable' });
});

// API routes
app.use('/api/stations', stationsRouter);
app.use('/api/download', downloadRouter);

let server;

// Connect to MongoDB and start listening for requests
const start = async () => {
    await connectMongoDB();
    server = app.listen(config.PORT, () => {
        logger.info(`Server listening on port ${config.PORT}`);
    });
    return server;
};

// Gracefully close HTTP server and MongoDB, with a 10s forced-exit timeout
const shutdown = async (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    if (server) {
        server.close(async () => {
            logger.info('HTTP server closed');
            await mongoose.disconnect();
            logger.info('MongoDB disconnected');
            process.exit(0);
        });
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
    }
};

// Listen for OS shutdown signals (Docker stop / Ctrl+C)
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Only auto-start when run directly (not when imported by tests)
if (require.main === module) {
    start();
}

module.exports = { app, start };
