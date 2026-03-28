const dotenv = require('dotenv');
const path = require('path');

// Load .env from project root (skip in tests — they set env vars directly)
if (process.env.NODE_ENV !== 'test') {
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const requiredVars = ['MONGODB_URL', 'S3_BUCKET_NAME', 'AWS_REGION'];

// Halt startup if any required env var is missing
const validateEnv = () => {
    const missing = requiredVars.filter((key) => !process.env[key]);
    if (missing.length) {
        console.error(
            `Missing required environment variables: ${missing.join(', ')}`
        );
        process.exit(1);
    }
};

validateEnv();

module.exports = {
    MONGODB_URL: process.env.MONGODB_URL,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    AWS_REGION: process.env.AWS_REGION,
    PORT: parseInt(process.env.PORT, 10) || 5004, // defaults to 5004
    S3_URL_EXPIRY: parseInt(process.env.S3_URL_EXPIRY, 10) || 900, // seconds, defaults to 15 min
    DISABLE_NOMINATIM: process.env.DISABLE_NOMINATIM === 'true', // defaults to false
};
