const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { AWS_REGION, S3_BUCKET_NAME, S3_URL_EXPIRY } = require('../config');

// Initialize the S3 client for the configured AWS region
const s3Client = new S3Client({ region: AWS_REGION });

// Generates a temporary pre-signed URL that allows downloading a file from S3
// without requiring AWS credentials. The URL expires after 15 minutes (900s).
const generatePresignedUrl = async (s3FileKey) => {
    // Build a "get object" command targeting the specific file in the bucket
    const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3FileKey,
    });

    // Sign the command to produce a time-limited download URL
    return await getSignedUrl(s3Client, command, { expiresIn: S3_URL_EXPIRY });
};

module.exports = { generatePresignedUrl };
