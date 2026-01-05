const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { requireAuth } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');

// Routes
router.post('/', requireAuth, companyContext, requireCompanyContext, paymentController.createPayment);
router.get('/customers/:customerId/statement', requireAuth, companyContext, requireCompanyContext, paymentController.getStatement);
router.delete('/:id', requireAuth, companyContext, requireCompanyContext, paymentController.deletePayment);

module.exports = router;
