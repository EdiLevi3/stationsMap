// Route for /api/download
// GET /?station=<id>&date=<YYYY-MM-DD> → returns a presigned S3 download URL

const express = require('express');
const { validateDownloadParams } = require('../middleware/validate');
const { getDownloadUrl } = require('../controllers/downloadController');

const router = express.Router();

router.get('/', validateDownloadParams, getDownloadUrl);

module.exports = router;
