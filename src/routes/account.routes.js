const express = require('express');
const multer = require('multer');
const { authenticateApiKey } = require('../middleware/auth');
const accountController = require('../controllers/account.controller');

const router = express.Router();

// Configure multer for file uploads (in-memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// POST /api/v1/account/setup - Create new account (no authentication required)
router.post('/setup', upload.single('certificado'), accountController.setup);

// GET /api/v1/account/status - Get account status (requires authentication)
router.get('/status', authenticateApiKey, accountController.getStatus);

// PUT /api/v1/account/certificate - Update certificate (requires authentication)
router.put('/certificate', authenticateApiKey, upload.single('certificado'), accountController.updateCertificate);

// DELETE /api/v1/account - Delete account (requires authentication)
router.delete('/', authenticateApiKey, accountController.deleteAccount);

module.exports = router;
