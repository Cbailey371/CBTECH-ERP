const express = require('express');
const router = express.Router();
const deliveryNoteController = require('../controllers/deliveryNoteController');
const { authenticateToken } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

router.get('/', requireCompanyContext, deliveryNoteController.getDeliveryNotes);
router.get('/:id', requireCompanyContext, deliveryNoteController.getDeliveryNoteById);
router.get('/:id/download', requireCompanyContext, deliveryNoteController.downloadPdf);
router.post('/', requireCompanyContext, deliveryNoteController.createDeliveryNote);
router.put('/:id', requireCompanyContext, deliveryNoteController.updateDeliveryNote);
router.patch('/:id/status', requireCompanyContext, deliveryNoteController.updateDeliveryNoteStatus);
router.delete('/:id', requireCompanyContext, deliveryNoteController.deleteDeliveryNote);

module.exports = router;
