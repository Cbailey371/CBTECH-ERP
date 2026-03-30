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
                    { 
                        model: SalesOrder, 
                        as: 'salesOrder',
                        include: [{ model: Customer, as: 'customer' }]
                    },
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
                include: [
                    { 
                        model: SalesOrderItem, 
                        as: 'items',
                        include: [{ model: Product, as: 'product' }]
                    }, 
                    { model: Customer, as: 'customer' }
                ]
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
                        description: originalItem.description || originalItem.product?.name,
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



            // 4. Generate Number (Safe Sequence)
            // Function defined inline or helper (better upstream)
            // Let's implement robust logic inline for now or consistency
            const year = new Date().getFullYear();
            const lastCN = await CreditNote.findOne({
                where: {
                    companyId: companyId,
                    number: { [Op.like]: `NC-${year}-%` }
                },
                order: [['id', 'DESC']],
                transaction
            });

            let nextSeq = 1;
            if (lastCN && lastCN.number) {
                const parts = lastCN.number.split('-');
                if (parts.length === 3) {
                    nextSeq = parseInt(parts[2], 10) + 1;
                }
            }

            const number = `NC-${year}-${String(nextSeq).padStart(4, '0')}`;

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
                docType: '03', // Nota de Crédito
                items: items.map(i => ({
                    description: i.description || 'Devolución de mercancía',
                    quantity: parseFloat(i.quantity),
                    price: parseFloat(i.unitPrice),
                    total: parseFloat(i.total),
                    taxRate: 0.07,
                    uom: 'und',
                    code: '1234567890',
                    cpbsAbr: '13',
                    cpbsCmp: '1310'
                })),
                customer: creditNote.customer.toJSON(),
                invoiceNumber: originalInvoiceDoc.cufe, // Mandatorio: CUFE de la factura afectada
                invoiceNumberRefDate: String(originalInvoiceDoc.authDate || creditNote.salesOrder.issueDate).split('T')[0], // Forzar YYYY-MM-DD
                // Issuer
                issuer: issuerConfig,
                totals: {
                    totalTaxable: creditNote.subtotal,
                    totalTax: creditNote.tax,
                    totalAmount: creditNote.total
                }
            };

            // 4. Send to PAC
            const pacAdapter = PACFactory.getAdapter(issuerConfig);
            const result = await pacAdapter.signAndSend(docData);

            if (result.success && result.status === 'AUTHORIZED') {
                // 5. Update Credit Note
                creditNote.status = 'authorized';
                creditNote.fiscalCufe = result.cufe;
                creditNote.fiscalNumber = result.feNumber || creditNote.number;
                await creditNote.save();

                // 6. Save FE_Document Record (for tracking and CAFE download)
                const feDoc = await FE_Document.create({
                    companyId: companyId,
                    creditNoteId: creditNote.id,
                    docType: '03', // NC
                    cufe: result.cufe,
                    qrUrl: result.qr,
                    xmlSigned: result.xmlSigned,
                    htmlContent: result.htmlContent, // Guardamos el HTML oficial de Digifact
                    pdfContent: result.pdfBase64,  // Guardamos el PDF oficial de Digifact
                    authDate: result.authDate || new Date(),
                    status: 'AUTHORIZED',
                    pacName: 'DIGIFACT',
                    protocol: result.protocol,
                    environment: issuerConfig.environment,
                });

                return res.json({ success: true, creditNote, document: feDoc });
            } else {
                // Document Rejected by PAC
                return res.status(400).json({ 
                    success: false, 
                    status: 'REJECTED',
                    error: result.error || 'La Nota de Crédito fue rechazada por el PAC sin motivo específico'
                });
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
    },

    // Download CAFE (PDF/HTML) for Credit Note
    async downloadCafe(req, res) {
        try {
            const { id } = req.params;
            const companyId = req.user.companyId;

            // 1. Find the Credit Note with associations
            const { Customer, SalesOrder, SalesOrderItem, Product } = require('../models');
            const creditNote = await CreditNote.findOne({
                where: { id, company_id: companyId },
                include: [
                    { model: Customer, as: 'customer' },
                    { 
                        model: SalesOrder, 
                        as: 'salesOrder',
                        include: [{ model: SalesOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }]
                    }
                ]
            });

            if (!creditNote) return res.status(404).json({ error: 'Nota de crédito no encontrada' });
            if (!creditNote.fiscalCufe) return res.status(400).json({ error: 'La nota de crédito no ha sido autorizada fiscalmente' });

            // 2. Find associated FE_Document
            const feDoc = await FE_Document.findOne({
                where: { 
                    [Op.or]: [
                        { creditNoteId: id },
                        { cufe: creditNote.fiscalCufe }
                    ],
                    companyId 
                }
            });

            if (!feDoc) return res.status(404).json({ error: 'Documento fiscal no encontrado' });

        // 3. Obtener datos para el generador Premium
        const issuerConfig = await FE_IssuerConfig.findOne({ where: { companyId } });
        const company = await Company.findByPk(companyId);

        // Referenced invoice info (Mandatory for NC)
        const referencedInvoices = [{
            number: creditNote.salesOrder?.orderNumber || 'N/A',
            date: creditNote.salesOrder?.issueDate || 'N/A'
        }];

        const formattedItems = (creditNote.items || []).map(i => {
            // En CreditNote, items suele ser un JSON con los datos capturados en el momento
            return {
                description: i.description || i.productName || 'Producto',
                quantity: parseFloat(i.quantity) || 0,
                price: parseFloat(i.unitPrice || i.price) || 0,
                total: parseFloat(i.total) || 0,
                taxRate: parseFloat(i.taxRate || 0.07),
                discount: parseFloat(i.discount || 0)
            };
        });

        let logoBuffer = null;
        if (company && company.documentLogo) {
            if (company.documentLogo.startsWith('data:image')) {
                logoBuffer = company.documentLogo;
            } else if (company.documentLogo.startsWith('http')) {
                try {
                    const fetch = require('node-fetch');
                    const response = await fetch(company.documentLogo);
                    const buffer = await response.buffer();
                    logoBuffer = `data:image/png;base64,${buffer.toString('base64')}`;
                } catch (e) {
                    console.error('Error fetching NC logo:', e.message);
                }
            }
        }

        const { calculateTaxes } = require('../utils/taxCalculations');
        const totals = calculateTaxes(formattedItems);

        const data = {
            docType: '03', // NC
            documentNumber: creditNote.number,
            issueDate: creditNote.date ? new Date(creditNote.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            cufe: creditNote.fiscalCufe,
            qrUrl: feDoc.qrUrl,
            protocol: feDoc.protocol || 'AUTORIZADO',
            customer: {
                name: creditNote.customer.name,
                ruc: creditNote.customer.taxId,
                address: creditNote.customer.address,
                email: creditNote.customer.email,
                phone: creditNote.customer.phone
            },
            items: formattedItems,
            issuer: issuerConfig,
            logo: logoBuffer,
            totals: totals,
            referencedInvoices: referencedInvoices
        };

        // Reconstrucción del QR dinámico
        let finalQrUrl = feDoc.qrUrl;
        if (!finalQrUrl && creditNote.fiscalCufe && issuerConfig) {
            const rucStr = issuerConfig.ruc || '';
            const fechaStr = data.issueDate;
            const montoStr = totals.totalAmount.toFixed(2);
            finalQrUrl = `https://dgi-fep.mef.gob.pa/Consultas/FacturasPorCUFE?cufe=${creditNote.fiscalCufe}&ruc=${rucStr}&fecha=${fechaStr}&monto=${montoStr}`;
        }
        data.qrUrl = finalQrUrl;

        const { generateCafePdf } = require('../services/pdf/cafeGenerator');
        
        // --- PRIORIDAD: Usar PDF oficial del proveedor (responseData3) ---
        if (feDoc.pdfContent) {
            console.log(`[NC_DOWNLOAD] Usando PDF (responseData3) del proveedor para: ${feDoc.cufe}`);
            const pdfBuffer = Buffer.from(feDoc.pdfContent, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=CAFE_${creditNote.number}.pdf`);
            return res.send(pdfBuffer);
        }

        // --- SEGUNDA OPCIÓN: Usar HTML oficial si no hay PDF ---
        if (feDoc.htmlContent) {
            console.log(`[NC_DOWNLOAD] Usando HTML (responseData2) del proveedor para: ${feDoc.cufe}`);
            res.setHeader('Content-Type', 'text/html');
            return res.send(feDoc.htmlContent);
        }

        // --- FALLBACK: Solo si no hay nada guardado ---
        console.log(`[NC_DOWNLOAD] No se encontró contenido del proveedor, generando formato local para: ${feDoc.cufe}`);
        const pdfBuffer = await generateCafePdf(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=CAFE_${creditNote.number}.pdf`);
        return res.send(pdfBuffer);
        } catch (error) {
            console.error('Error downloadCafe CN:', error);
            return res.status(500).json({ error: error.message });
        }
    }
};

module.exports = creditNoteController;
