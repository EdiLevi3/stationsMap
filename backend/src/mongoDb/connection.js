// Establishes a connection to MongoDB using Mongoose.
// Exits the process if the connection fails (prevents running without a database).

const mongoose = require('mongoose');
const { MONGODB_URL } = require('../config');
const logger = require('../logger');

const connectMongoDB = async () => {
    try {
        await mongoose.connect(MONGODB_URL, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error({ err: error }, 'MongoDB connection error');
        process.exit(1);
    }
};

module.exports = connectMongoDB;
