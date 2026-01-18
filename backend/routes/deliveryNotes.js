const express = require('express');
const router = express.Router();
const deliveryNoteController = require('../controllers/deliveryNoteController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', deliveryNoteController.getDeliveryNotes);
router.get('/:id', deliveryNoteController.getDeliveryNoteById);
router.get('/:id/download', deliveryNoteController.downloadPdf);
router.post('/', deliveryNoteController.createDeliveryNote);
router.patch('/:id/status', deliveryNoteController.updateDeliveryNoteStatus);
router.delete('/:id', deliveryNoteController.deleteDeliveryNote);

module.exports = router;
