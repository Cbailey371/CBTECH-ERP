const express = require('express');
const router = express.Router();
const salesOrderController = require('../controllers/salesOrderController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken); // Apply auth to all

router.get('/', salesOrderController.getOrders);
router.get('/:id', salesOrderController.getOrderById);
router.post('/', salesOrderController.createOrder);
router.post('/from-quotation', salesOrderController.createFromQuotation);
router.get('/:id/pdf', salesOrderController.downloadPdf);
router.patch('/:id/status', salesOrderController.updateOrderStatus);

module.exports = router;
