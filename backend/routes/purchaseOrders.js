const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
    PurchaseOrder,
    PurchaseOrderItem,
    Company,
    Supplier,
    Product,
    sequelize
} = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Middleware Helper
const getPO = async (id, companyId) => {
    const po = await PurchaseOrder.findOne({
        where: { id, companyId },
        include: [
            { model: Supplier, as: 'supplier' },
            { model: PurchaseOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
        ]
    });
    return po;
};

// GET /api/purchase-orders
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            supplierId,
            startDate,
            endDate
        } = req.query;

        const companyId = req.user.companyId || req.headers['x-company-id'];
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const whereClause = { companyId };

        if (status) whereClause.status = status;
        if (supplierId) whereClause.supplierId = supplierId;

        if (startDate && endDate) {
            whereClause.issueDate = { [Op.between]: [startDate, endDate] };
        }

        if (search) {
            whereClause[Op.or] = [
                { orderNumber: { [Op.iLike]: `%${search}%` } },
                { '$supplier.name$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await PurchaseOrder.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Supplier,
                    as: 'supplier',
                    attributes: ['name', 'id']
                }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['issueDate', 'DESC'], ['id', 'DESC']]
        });

        res.json({
            success: true,
            data: {
                purchaseOrders: rows,
                total: count,
                page: parseInt(page),
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching POs:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/purchase-orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.companyId || req.headers['x-company-id'];
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const po = await getPO(req.params.id, companyId);
        if (!po) return res.status(404).json({ message: 'Purchase Order not found' });

        res.json({ success: true, data: po });
    } catch (error) {
        console.error('Error fetching PO:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/purchase-orders
router.post('/', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const companyId = req.user.companyId || req.headers['x-company-id'];
        if (!companyId) return res.status(400).json({ message: 'Company ID required' });

        const {
            supplierId,
            issueDate,
            deliveryDate,
            paymentTerms,
            notes,
            items = []
        } = req.body;

        // Sanitize dates
        const validIssueDate = issueDate || new Date();
        const validDeliveryDate = deliveryDate ? deliveryDate : null;

        // Generate Order Number (Simple sequential logic for now, ideally strictly serial)
        const count = await PurchaseOrder.count({ where: { companyId }, transaction });
        const orderNumber = `OC-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

        // Calculate Totals
        let subtotal = 0;
        let taxTotal = 0;

        const preparedItems = items.map(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = itemSubtotal * (item.taxRate || 0);
            subtotal += itemSubtotal;
            taxTotal += itemTax;

            return {
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate || 0,
                subtotal: itemSubtotal
            };
        });

        const total = subtotal + taxTotal;

        const po = await PurchaseOrder.create({
            companyId,
            supplierId,
            orderNumber,
            status: 'draft',
            issueDate: validIssueDate,
            deliveryDate: validDeliveryDate,
            paymentTerms,
            notes,
            subtotal,
            taxTotal,
            total
        }, { transaction });

        if (preparedItems.length > 0) {
            await PurchaseOrderItem.bulkCreate(preparedItems.map(i => ({ ...i, purchaseOrderId: po.id })), { transaction });
        }

        await transaction.commit();

        const createdPO = await getPO(po.id, companyId);
        res.status(201).json({ success: true, data: createdPO });

    } catch (error) {
        await transaction.rollback();
        console.error('Error creating PO:', error);
        res.status(500).json({
            message: 'Server Error',
            error: error.message,
            stack: error.stack
        });
    }
});

// PUT /api/purchase-orders/:id
router.put('/:id', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const companyId = req.user.companyId || req.headers['x-company-id'];
        const { supplierId, issueDate, deliveryDate, paymentTerms, notes, items } = req.body;

        const po = await PurchaseOrder.findOne({ where: { id: req.params.id, companyId }, transaction });
        if (!po) {
            await transaction.rollback();
            return res.status(404).json({ message: 'PO not found' });
        }

        if (po.status !== 'draft') {
            await transaction.rollback();
            return res.status(400).json({ message: 'Cannot edit PO unless it is in Draft status' });
        }

        // Recalculate if items provided
        let updateData = { supplierId, issueDate, deliveryDate, paymentTerms, notes };

        if (items) {
            // Replace items
            await PurchaseOrderItem.destroy({ where: { purchaseOrderId: po.id }, transaction });

            let subtotal = 0;
            let taxTotal = 0;

            const preparedItems = items.map(item => {
                const itemSubtotal = item.quantity * item.unitPrice;
                const itemTax = itemSubtotal * (item.taxRate || 0);
                subtotal += itemSubtotal;
                taxTotal += itemTax;

                return {
                    purchaseOrderId: po.id,
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate || 0,
                    subtotal: itemSubtotal
                };
            });

            await PurchaseOrderItem.bulkCreate(preparedItems, { transaction });

            updateData.subtotal = subtotal;
            updateData.taxTotal = taxTotal;
            updateData.total = subtotal + taxTotal;
        }

        await po.update(updateData, { transaction });
        await transaction.commit();

        const updatedPO = await getPO(po.id, companyId);
        res.json({ success: true, data: updatedPO });

    } catch (error) {
        await transaction.rollback();
        console.error('Error updating PO:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/purchase-orders/:id/status
router.put('/:id/status', authenticateToken, async (req, res) => {
    try {
        const companyId = req.user.companyId || req.headers['x-company-id'];
        const { status } = req.body;

        const po = await PurchaseOrder.findOne({ where: { id: req.params.id, companyId } });
        if (!po) return res.status(404).json({ message: 'PO not found' });

        // Logic for transitions allowed?
        // Draft -> Approval, Approval -> Approved, Approved -> Sent
        // Simple for now.

        await po.update({ status });
        res.json({ success: true, message: 'Status updated', data: po });

    } catch (error) {
        console.error('Error updating PO status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/purchase-orders/:id/receive
router.post('/:id/receive', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const companyId = req.user.companyId || req.headers['x-company-id'];
        const { receivedItems } = req.body; // Array of { itemId, quantityReceived }

        const po = await PurchaseOrder.findOne({
            where: { id: req.params.id, companyId },
            include: [{ model: PurchaseOrderItem, as: 'items' }],
            transaction
        });

        if (!po) {
            await transaction.rollback();
            return res.status(404).json({ message: 'PO not found' });
        }

        if (!['sent', 'partial_received'].includes(po.status)) {
            // Can allow receiving if already partial, or sent.
            // Also logically 'approved' could be received if skipped 'sent'.
        }

        let allFullyReceived = true;
        let anyReceived = false;

        // Map current items for easy access
        const itemsMap = new Map(po.items.map(i => [i.id, i]));

        // Process received items
        for (const input of receivedItems) {
            const item = itemsMap.get(input.itemId);
            if (item) {
                // Update received quantity
                // input.quantityReceived is the *incremental* amount being received now? 
                // OR total? Usually receiving is incremental per shipment.
                // Requirement: "Registrar lo recibido" -> assume incremental.

                const newReceived = parseFloat(item.receivedQuantity) + parseFloat(input.quantityReceived);

                await item.update({ receivedQuantity: newReceived }, { transaction });
                item.receivedQuantity = newReceived; // Update local obj for status check
            }
        }

        // Check overall status
        for (const item of po.items) {
            if (parseFloat(item.receivedQuantity) > 0) anyReceived = true;
            if (parseFloat(item.receivedQuantity) < parseFloat(item.quantity)) {
                allFullyReceived = false;
            }
        }

        let newStatus = po.status;
        if (allFullyReceived) {
            newStatus = 'received'; // Or closed? 'received' typically.
        } else if (anyReceived) {
            newStatus = 'partial_received';
        }

        if (newStatus !== po.status) {
            await po.update({ status: newStatus }, { transaction });
        }

        await transaction.commit();

        const updatedPO = await getPO(po.id, companyId);
        res.json({ success: true, data: updatedPO });

    } catch (error) {
        await transaction.rollback();
        console.error('Error receiving PO:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE /api/purchase-orders/:id
router.delete('/:id', authenticateToken, async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const companyId = req.user.companyId || req.headers['x-company-id'];
        const po = await PurchaseOrder.findOne({ where: { id: req.params.id, companyId }, transaction });

        if (!po) {
            await transaction.rollback();
            return res.status(404).json({ message: 'PO not found' });
        }

        if (!['draft', 'cancelled'].includes(po.status)) {
            await transaction.rollback();
            return res.status(400).json({ message: 'Only draft or cancelled orders can be deleted' });
        }

        // Delete items first
        await PurchaseOrderItem.destroy({ where: { purchaseOrderId: po.id }, transaction });

        // Delete PO
        await po.destroy({ transaction });

        await transaction.commit();
        res.json({ success: true, message: 'Purchase Order deleted' });

    } catch (error) {
        await transaction.rollback();
        console.error('Error deleting PO:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
