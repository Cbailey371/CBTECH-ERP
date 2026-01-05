const { sequelize, SalesOrder, SalesOrderItem, Customer, Product, Quotation, QuotationItem, Company, FE_IssuerConfig, Payment } = require('../models');
const { Op } = require('sequelize');
const { generateInvoicePdf } = require('../services/pdf/invoicePdfGenerator');

// --- Helpers ---
const getOrder = async (id, companyId) => {
    return await SalesOrder.findOne({
        where: { id, companyId },
        include: [
            { model: Customer, as: 'customer' },
            { model: SalesOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] },
            { model: Payment, as: 'payments' }
        ]
    });
};

// --- CRUD ---

exports.getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status, startDate, endDate } = req.query;
        const companyId = req.user.companyId;

        const whereClause = { companyId };

        if (status) whereClause.status = status;
        if (startDate && endDate) {
            whereClause.issueDate = { [Op.between]: [startDate, endDate] };
        }
        if (search) {
            whereClause[Op.or] = [
                { orderNumber: { [Op.iLike]: `% ${search}% ` } },
                { '$customer.name$': { [Op.iLike]: `% ${search}% ` } }
            ];
        }

        const offset = (page - 1) * limit;
        const { count, rows } = await SalesOrder.findAndCountAll({
            where: whereClause,
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'id'] }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['issueDate', 'DESC'], ['id', 'DESC']]
        });

        res.json({
            success: true,
            orders: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        console.log('GET ORDER BY ID REQUEST:', req.params.id, 'Company:', req.user.companyId);
        const order = await getOrder(req.params.id, req.user.companyId);
        if (!order) {
            console.log('Order not found in DB');
            return res.status(404).json({ error: 'Orden no encontrada' });
        }
        res.json({ success: true, order });
    } catch (error) {
        console.error('ERROR in getOrderById:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createOrder = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const companyId = req.user.companyId;
        const { customerId, issueDate, notes, items, currency = 'USD', discountType, discountValue } = req.body;

        // Validations
        if (!items || items.length === 0) throw new Error("La orden debe tener al menos un ítem.");

        // Generate Number
        const count = await SalesOrder.count({ where: { companyId }, transaction: t });
        const orderNumber = `F - ${new Date().getFullYear()} -${String(count + 1).padStart(4, '0')} `;

        // Calculate Totals
        let subtotal = 0, taxTotal = 0;
        const preparedItems = items.map(item => {
            const qty = parseFloat(item.quantity) || 0;
            const price = parseFloat(item.unitPrice) || 0;
            const taxRate = parseFloat(item.taxRate) || 0;
            const discount = parseFloat(item.discount) || 0;

            const lineSubtotal = (qty * price) - discount;
            const lineTax = lineSubtotal * taxRate;

            subtotal += lineSubtotal;
            taxTotal += lineTax;

            return {
                productId: item.productId,
                description: item.description,
                quantity: qty,
                unitPrice: price,
                discount: discount,
                taxRate: taxRate,
                subtotal: lineSubtotal,
                total: lineSubtotal + lineTax
            };
        });

        // Backend Recalculation of Global Params (optional but recommended for consistency)
        // Note: The frontend sends the final global discount amount in 'req.body.discount' (which typically matches 'totals.globalDiscount')
        // OR we can calculate it here if we want to be strict.
        // SalesOrder model's 'discount' field is the amount.
        // We'll trust provided discount amount for now or recalculate if logic needed.
        // Actually SalesOrder schema 'discount' IS the global discount amount.

        // Let's rely on what the frontend sends for the global discount amount if possible, 
        // to avoid mismatch with frontend rounding.
        // But req.body might not have 'discount' explicitly as the amount relative to the items.
        // Let's assume req.body.discount is available or we calculate it from Type/Value.

        let globalDiscountAmt = 0;
        const netItemsTotal = subtotal; // This is actually Gross - ItemDiscounts

        if (discountType === 'percentage') {
            globalDiscountAmt = netItemsTotal * (parseFloat(discountValue || 0) / 100);
        } else {
            globalDiscountAmt = parseFloat(discountValue || 0);
        }

        const total = subtotal + taxTotal - globalDiscountAmt; // Formula: (ItemsSubtotal) - GlobalDisc + Tax
        // Wait, Tax is usually calculated on the (Subtotal - GlobalDisc) if the discount is Pre-Tax.
        // Tax logic typically: (Gross - ItemDisc - GlobalDisc) * TaxRate.
        // But here 'taxTotal' is sum of LineTaxes.
        // Line Taxes are (LineGross - LineDisc) * LineRate.
        // If Global Discount exists, does it reduce the Taxable Base?
        // In this simple model (Sum of Lines), it's hard to apply Global Discount to reduce Tax unless we distribute it.
        // For now, let's keep the logic simple: Total = (Sum Line Subtotals + Sum Line Taxes) - Global Discount.
        // This effectively means Global Discount is "Post-Tax" or simply a reduction in final payment, 
        // OR it implies we aren't adjusting the tax base for the global discount. 
        // Given the code, let's stick to the arithmetic:

        const finalTotal = Math.max(0, subtotal + taxTotal - globalDiscountAmt);

        // Create Header
        const order = await SalesOrder.create({
            companyId,
            customerId,
            orderNumber,
            issueDate: issueDate || new Date(),
            status: 'draft',
            currency,
            subtotal,
            taxTotal,
            total: finalTotal,
            discount: globalDiscountAmt, // Store the calculated/derived amount
            discountType: discountType || 'amount',
            discountValue: discountValue || 0,
            notes,
            createdBy: req.user.id
        }, { transaction: t });

        // Create Items
        await SalesOrderItem.bulkCreate(
            preparedItems.map(i => ({ ...i, salesOrderId: order.id })),
            { transaction: t }
        );

        await t.commit();
        const createdOrder = await getOrder(order.id, companyId);
        res.status(201).json({ success: true, order: createdOrder });

    } catch (error) {
        await t.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.createFromQuotation = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        console.log('--- STARTING createFromQuotation ---');
        const { quotationId } = req.body;
        const companyId = req.user.companyId;
        console.log({ quotationId, companyId });

        const quotation = await Quotation.findOne({
            where: { id: quotationId, companyId },
            include: [{ model: QuotationItem, as: 'items' }]
        });

        if (!quotation) {
            console.log('Quotation not found');
            throw new Error("Cotización no encontrada");
        }
        console.log('Quotation found:', quotation.id);

        // Generate Number
        const count = await SalesOrder.count({ where: { companyId }, transaction: t });
        const orderNumber = `F - ${new Date().getFullYear()} -${String(count + 1).padStart(4, '0')} `;
        console.log('Generated Order Number:', orderNumber);

        // Create Order
        const orderData = {
            companyId,
            customerId: quotation.customerId,
            quotationId: quotation.id,
            orderNumber,
            issueDate: new Date(),
            status: 'draft',
            currency: 'USD',
            discount: quotation.discount,
            discountType: quotation.discountType,
            discountValue: quotation.discountValue,
            subtotal: quotation.subtotal,
            taxTotal: quotation.tax,
            total: quotation.total,
            notes: `Generado desde Cotización ${quotation.number}. ${quotation.notes || ''} `,
            createdBy: req.user.id
        };
        console.log('Creating Order Header:', orderData);

        const order = await SalesOrder.create(orderData, { transaction: t });
        console.log('Order Header Created:', order.id);

        // Copy Items
        const items = quotation.items.map(i => ({
            salesOrderId: order.id,
            productId: i.productId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount || 0,
            taxRate: quotation.taxRate || 0.07,
            subtotal: i.total / (1 + (quotation.taxRate || 0.07)),
            total: i.total
        }));
        // Better: Recalculate precisely using same logic as createOrder to avoid rounding drifts
        // For now, mapping directly for speed.
        console.log('Preparing items to create:', items);

        await SalesOrderItem.bulkCreate(items, { transaction: t });
        console.log('Items Created successfully');

        // Update Quotation Status
        quotation.status = 'invoiced';
        await quotation.save({ transaction: t });
        console.log('Quotation status updated to invoiced');

        await t.commit();
        console.log('Transaction Committed');
        res.json({ success: true, orderId: order.id });

    } catch (error) {
        await t.rollback();
        console.error('--- ERROR in createFromQuotation ---');
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.downloadPdf = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const order = await getOrder(id, companyId);
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const company = await Company.findByPk(companyId);
        const issuerConfig = await FE_IssuerConfig.findOne({ where: { companyId } });

        const pdfBuffer = await generateInvoicePdf(order, company, issuerConfig);

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `inline; filename = "Factura_${order.orderNumber}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Error generating PDF' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await SalesOrder.findOne({ where: { id, companyId: req.user.companyId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        await order.update({ status });
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const order = await SalesOrder.findOne({
            where: { id, companyId },
            include: [{ model: SalesOrderItem, as: 'items' }]
        });

        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

        // Check status - only 'draft' (No Fiscalizada) can be deleted
        if (order.status !== 'draft') {
            return res.status(400).json({ error: 'Solo se pueden eliminar facturas en estado Borrador (No Fiscalizadas)' });
        }

        // Optional: Extra safety check for fiscal document existence?
        // If status logic is consistent, draft implies no fiscal doc.
        // But let's be safe if we had FE_Document imported.
        // logic: if (await FE_Document.findOne({where: {salesOrderId: id, status: 'AUTHORIZED'}})) ...

        // Delete items (if cascade not set, but bulkDelete is safer)
        if (order.items && order.items.length > 0) {
            await SalesOrderItem.destroy({ where: { salesOrderId: id } });
        }

        await order.destroy();
        res.json({ success: true, message: 'Factura eliminada correctamente' });

    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: error.message });
    }
};
