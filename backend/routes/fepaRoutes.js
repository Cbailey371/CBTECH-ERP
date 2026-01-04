const express = require('express');
const router = express.Router();
const fepaController = require('../controllers/fepa/fepaController');
const { authenticateToken } = require('../middleware/auth'); // Ensure this middleware exists

// Config
router.get('/config', authenticateToken, fepaController.getConfig);
router.post('/config', authenticateToken, fepaController.saveConfig);

// Emission
router.post('/emit/:orderId', authenticateToken, fepaController.emitDocument);

// PDF
router.get('/cafe/:id', authenticateToken, fepaController.downloadCafe);

module.exports = router;
