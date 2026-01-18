const { CreditNote, SalesOrder, SalesOrderItem, Company, Customer, Product, User, sequelize, FE_IssuerConfig, FE_Document } = require('../models');
const { Op } = require('sequelize');
const PACFactory = require('../services/fepa/PACFactory');
const { calculateTaxes } = require('../utils/taxCalculations');

const creditNoteController = {
    // List Credit Notes
    async getCreditNotes(req, res) {
        try {
            const companyId = req.user.companyId;
            const { page = 1, limit = 10, search = '', status, startDate, endDate } = req.query;
            const offset = (page - 1) * limit;

            const where = { companyId: companyId };

            // Filters
            if (status && status !== 'all') {
                where.status = status;
            }
            if (startDate && endDate) {
                where.date = { [Op.between]: [startDate, endDate] };
            }

            if (search) {
                where[Op.or] = [
                    { number: { [Op.iLike]: `%${search}%` } },
                    { '$customer.name$': { [Op.iLike]: `%${search}%` } },
                    { '$salesOrder.orderNumber$': { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { count, rows } = await CreditNote.findAndCountAll({
                where,
                include: [
                    { model: Customer, as: 'customer', attributes: ['name', 'tax_id'] },
                    { model: SalesOrder, as: 'salesOrder', attributes: ['orderNumber', 'issueDate'] },
                    { model: User, as: 'creator', attributes: ['username'] }
                ],
                limit,
                offset,
                order: [['date', 'DESC'], ['id', 'DESC']]
            });

            return res.json({
                success: true,
                creditNotes: rows,
                pagination: {
                    total: count,
                    totalPages: Math.ceil(count / limit),
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Error in getCreditNotes:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // Get Single Credit Note
    async getCreditNoteById(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user.companyId;
            const note = await CreditNote.findOne({
                where: { id, companyId: companyId },
                include: [
                    { model: Customer, as: 'customer' },
                    { model: SalesOrder, as: 'salesOrder' },
                    { model: User, as: 'creator', attributes: ['username'] }
                ]
            });

            if (!note) return res.status(404).json({ success: false, error: 'Nota de crédito no encontrada' });

            return res.json({ success: true, creditNote: note });
        } catch (error) {
            console.error('Error in getCreditNoteById:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // Create Draft Credit Note
    async createCreditNote(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const companyId = req.user.companyId;
            const userId = req.user.id;
            const { salesOrderId, refundType, items, reason, notes } = req.body;

            // 1. Validate Sales Order
            const salesOrder = await SalesOrder.findOne({
                where: { id: salesOrderId, companyId: companyId },
                include: [{ model: SalesOrderItem, as: 'items' }, { model: Customer, as: 'customer' }]
            });

            if (!salesOrder) throw new Error('Factura original no encontrada');
            // Allow CN even if not fulfilled? Usually yes, but implies reversing a transaction.
            // If status is 'draft', cannot issue CN.
            if (salesOrder.status === 'draft') throw new Error('No se puede crear Nota de Crédito de una factura borrador');

            // 2. Prepare Items
            let finalItems = [];

            if (refundType === 'full') {
                // Copy all items exactly
                finalItems = salesOrder.items.map(item => ({
                    productId: item.productId,
                    description: item.description || item.product?.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    total: item.total,
                    discount: item.discount, // Assuming simple amount
                    taxRate: 0 // Will need to infer or fetch ??
                }));
            } else {
                // Partial: items provided in body
                if (!items || items.length === 0) throw new Error('Debe especificar ítems para devolución parcial');

                // Validate items belong to SO and qty <= original
                finalItems = items.map(reqItem => {
                    const originalItem = salesOrder.items.find(i => i.productId == reqItem.productId || i.id == reqItem.originalItemId);
                    if (!originalItem) throw new Error(`Ítem inválido: ${reqItem.description}`);

                    const qty = parseFloat(reqItem.quantity);
                    if (qty > parseFloat(originalItem.quantity)) throw new Error(`Cantidad excede original para ${reqItem.description}`);

                    return {
                        productId: originalItem.productId,
                        description: originalItem.description,
                        quantity: qty,
                        unitPrice: parseFloat(originalItem.unitPrice),
                        total: qty * parseFloat(originalItem.unitPrice), // Recalculate basic total
                        // Discounts logic for partial is complex, we simplify: proportional? or manual?
                        // For now: assume no discount on partial or manual override.
                        // Let's assume Unit Price is fixed.
                    };
                });
            }

            // 3. Calculate Totals
            const subtotal = finalItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);

            // Tax Logic: Simplified for now (assuming 7% or inferred from original).
            // Better: use taxTotal from original and prorate if full.
            let tax = 0;
            if (refundType === 'full') {
                tax = parseFloat(salesOrder.taxTotal);
            } else {
                // Estimate tax based on ratio
                const originalSubtotal = parseFloat(salesOrder.subtotal);
                const ratio = originalSubtotal > 0 ? subtotal / originalSubtotal : 0;
                tax = parseFloat(salesOrder.taxTotal) * ratio;
            }

            const total = subtotal + tax; // ignoring discounts for simplicity in this draft

            // 4. Generate Number (Simple sequence)
            const count = await CreditNote.count({ where: { company_id: companyId } });
            const number = `NC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

            // 5. Create Record
            const creditNote = await CreditNote.create({
                companyId: companyId,
                customerId: salesOrder.customerId,
                salesOrderId: salesOrder.id,
                number,
                date: new Date(),
                reason: reason || 'Devolución',
                subtotal,
                tax,
                total,
                status: 'draft',
                items: finalItems,
                createdBy: userId
            }, { transaction });

            await transaction.commit();

            return res.json({ success: true, creditNote });
        } catch (error) {
            await transaction.rollback();
            console.error('Error createCreditNote:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // Emit Credit Note to PAC
    async emitCreditNote(req, res) {
        const { id } = req.params;
        const companyId = req.user.companyId;

        try {
            // 1. Fetch Credit Note & Config
            const creditNote = await CreditNote.findOne({
                where: { id, company_id: companyId },
                include: [
                    { model: Customer, as: 'customer' },
                    { model: SalesOrder, as: 'salesOrder' }
                ]
            });

            if (!creditNote) return res.status(404).json({ error: 'Nota de crédito no encontrada' });
            if (creditNote.status === 'authorized') return res.status(400).json({ error: 'Nota ya emitida' });

            const issuerConfig = await FE_IssuerConfig.findOne({ where: { companyId } });
            if (!issuerConfig || !issuerConfig.isActive) {
                return res.status(400).json({ error: 'Configuración FEPA inactiva o faltante' });
            }

            // 2. Fetch Original Invoice Fiscal Data
            const originalInvoiceDoc = await FE_Document.findOne({
                where: { salesOrderId: creditNote.salesOrderId, status: 'AUTHORIZED' }
            });

            // Note: If original invoice is not electronic, we might use system ref? 
            // For now, enforce that original must be emitted.
            if (!originalInvoiceDoc) {
                return res.status(400).json({ error: 'La factura original no tiene CUFE (no ha sido emitida electrónicamente).' });
            }

            // 3. Prepare Payload
            const items = creditNote.items || []; // JSONB column

            const docData = {
                documentNumber: creditNote.number,
                docType: 'C', // Credit Note
                items: items.map(i => ({
                    description: i.description,
                    quantity: i.quantity,
                    price: i.unitPrice,
                    total: i.total,
                    taxRate: 0.07 // FIXME: Store taxRate in items json or infer
                })),
                customer: {
                    name: creditNote.customer.name,
                    ruc: creditNote.customer.tax_id || 'CONSUMIDOR FINAL',
                    address: creditNote.customer.address
                },
                invoiceNumber: originalInvoiceDoc.cufe, // Mandatorio: CUFE de la factura afectada
                invoiceNumberRefDate: creditNote.salesOrder.issueDate, // Fecha de la factura afectada (YYYY-MM-DD)
                // Issuer
                issuer: issuerConfig,
                totals: {
                    totalTaxable: creditNote.subtotal, // Assuming stored correctly
                    totalTax: creditNote.tax,
                    totalAmount: creditNote.total
                }
            };

            // 4. Send to PAC
            const pacAdapter = PACFactory.getAdapter(issuerConfig);
            const result = await pacAdapter.signAndSend(docData);

            if (result.success) {
                // 5. Update Credit Note
                creditNote.status = 'authorized';
                creditNote.fiscalCufe = result.cufe;
                creditNote.fiscalNumber = result.feNumber || creditNote.number;
                await creditNote.save();

                // 6. Save FE_Document Record (Optional but good for tracking history)
                // We might want to create a FE_Document for the Credit Note too?
                // The FE_Document model usually links to SalesOrder. warning: we don't have creditNoteId in FE_Document.
                // For now, we store fiscal info in CreditNote model tables fields `fiscal_cufe`.

                return res.json({ success: true, creditNote });
            } else {
                return res.status(400).json({ error: 'Error del PAC: ' + result.error });
            }

        } catch (error) {
            console.error('Error emitCreditNote:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    },

    // Delete Draft Credit Note
    async deleteCreditNote(req, res) {
        const { id } = req.params;
        const companyId = req.user.companyId;

        try {
            const creditNote = await CreditNote.findOne({
                where: { id, companyId: companyId }
            });

            if (!creditNote) return res.status(404).json({ error: 'Nota de crédito no encontrada' });
            if (creditNote.status !== 'draft') {
                return res.status(400).json({ error: 'Solo se pueden eliminar notas de crédito en borrador' });
            }

            await creditNote.destroy();
            return res.json({ success: true, message: 'Nota de crédito eliminada correctamente' });

        } catch (error) {
            console.error('Error deleteCreditNote:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }
};

module.exports = creditNoteController;
