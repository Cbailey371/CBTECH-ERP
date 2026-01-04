const express = require('express');
const router = express.Router();
const creditNoteController = require('../controllers/creditNoteController');
const { requireAuth, requireCompanyContext } = require('../middleware/auth');

// Apply middleware
router.use(requireAuth);
router.use(requireCompanyContext);

// Routes
router.get('/', creditNoteController.getCreditNotes);
router.get('/:id', creditNoteController.getCreditNoteById);
router.post('/', creditNoteController.createCreditNote);
router.post('/:id/emit', creditNoteController.emitCreditNote);
router.delete('/:id', creditNoteController.deleteCreditNote);

module.exports = router;
