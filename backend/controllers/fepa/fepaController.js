const { sequelize } = require('../../config/database');
const FE_IssuerConfig = require('../../models/FE_IssuerConfig');
const FE_Document = require('../../models/FE_Document');
const SalesOrder = require('../../models/SalesOrder');
const SalesOrderItem = require('../../models/SalesOrderItem');
const Customer = require('../../models/Customer');
const PACFactory = require('../../services/fepa/PACFactory');
const { generateCafePdf } = require('../../services/pdf/cafeGenerator');
const { calculateTaxes } = require('../../utils/taxCalculations');

// --- Configuration ---

exports.getConfig = async (req, res) => {
    try {
        const companyId = req.user.companyId; // Assumes auth middleware sets this
        const config = await FE_IssuerConfig.findOne({ where: { companyId } });
        res.json(config || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveConfig = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const data = req.body;

        let config = await FE_IssuerConfig.findOne({ where: { companyId } });
        if (config) {
            await config.update(data);
        } else {
            await FE_IssuerConfig.create({ ...data, companyId });
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- Emission ---

exports.emitDocument = async (req, res) => {
    const { orderId } = req.params;
    const companyId = req.user.companyId;

    try {
        // 1. Get Config & Sales Order
        const issuerConfig = await FE_IssuerConfig.findOne({ where: { companyId } });
        if (!issuerConfig || !issuerConfig.isActive) {
            return res.status(400).json({ error: 'Configuración FEPA faltante o inactiva.' });
        }

        const Product = require('../../models/Product');
        const order = await SalesOrder.findOne({
            where: { id: orderId, companyId },
            include: [
                { model: Customer, as: 'customer' },
                { model: SalesOrderItem, as: 'items', include: [{ model: Product, as: 'product' }] }
            ]
        });

        if (!order) return res.status(404).json({ error: 'Orden no encontrada.' });

        // 2. Prepare Data (Normalize)
        const items = order.items || [];

        const docData = {
            documentNumber: order.orderNumber,
            docType: '01', // Factura
            issueDate: new Date(),
            items: items.map(i => ({
                description: i.description || (i.product ? i.product.name : 'Artículo general'),
                quantity: parseFloat(i.quantity),
                price: parseFloat(i.unitPrice),
                discount: parseFloat(i.discount) || 0,
                total: parseFloat(i.total),
                taxRate: parseFloat(i.taxRate) || 0,
                uom: i.uom || 'ud',
                code: i.product ? i.product.itemCode : '1234567890',
                cpbsAbr: i.product ? i.product.cpbsAbr : '13',
                cpbsCmp: i.product ? i.product.cpbsCmp : '1310'
            })),
            customer: order.customer.toJSON(),
            documentNumber: order.orderNumber, // Incluir el número original para AI04
            // Metadata for PDF
            issuer: issuerConfig,
            totals: calculateTaxes(items.map(i => ({ ...i.toJSON(), taxRate: parseFloat(i.taxRate) || 0 }))) // Recalculate using real tax rate
        };

        // 3. Select PAC & Send
        const pacAdapter = PACFactory.getAdapter(issuerConfig);
        const result = await pacAdapter.signAndSend(docData);

        // 4. Save FE_Document
        const feDoc = await FE_Document.create({
            companyId,
            salesOrderId: order.id,
            docType: '01',
            status: result.status,
            cufe: result.cufe,
            qrUrl: result.qr,
            xmlSigned: result.xmlSigned,
            htmlContent: result.htmlContent, // Guardamos el HTML oficial de Digifact
            pdfContent: result.pdfBase64,  // Guardamos el PDF oficial de Digifact
            authDate: result.authDate,
            rejectionReason: result.error,
            pacName: issuerConfig.pacProvider,
            environment: issuerConfig.environment
        });

        // 5. Update Sales Order Status if Authorized
        if (result.status === 'AUTHORIZED') {
            await order.update({ status: 'fulfilled' });
        }

        res.json({ success: result.success, document: feDoc });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// --- CAFE (PDF) ---

exports.downloadCafe = async (req, res) => {
    try {
        const { id } = req.params; // FE_Document ID
        const feDoc = await FE_Document.findByPk(id, {
            include: [{
                model: SalesOrder,
                as: 'salesOrder',
                include: [
                    { model: Customer, as: 'customer' },
                    { model: SalesOrderItem, as: 'items' }
                ]
            }]
        });

        if (!feDoc) return res.status(404).json({ error: 'Documento no encontrado' });

        const issuerConfig = await FE_IssuerConfig.findOne({ where: { companyId: feDoc.companyId } });
        const order = feDoc.salesOrder;
        const items = order ? (order.items || []) : [];

        // PRIORIDAD 1: PDF ORIGINAL DE DIGIFACT (CUALQUIER PAC QUE DE PDF REAL)
        if (feDoc.pdfContent) {
            const buffer = Buffer.from(feDoc.pdfContent, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=CAFE-${feDoc.cufe}.pdf`);
            return res.send(buffer);
        }

        // PRIORIDAD 2: HTML ORIGINAL DE DIGIFACT (DECODIFICADO)
        if (feDoc.htmlContent) {
            // Digifact devuelve el HTML codificado en Base64 en responseData2
            const decodedHtml = Buffer.from(feDoc.htmlContent, 'base64').toString('utf-8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename=CAFE-${feDoc.cufe}.html`);
            return res.send(decodedHtml);
        }

        // Si no hay HTML (PACs antiguos o errores), generamos el PDF interno como fallback
        const formattedItems = items.map(i => ({
            description: i.description,
            quantity: parseFloat(i.quantity) || 0,
            price: parseFloat(i.unitPrice) || 0,
            total: parseFloat(i.total) || 0,
            taxRate: parseFloat(i.taxRate) || 0
        }));

        const data = {
            documentNumber: order.orderNumber,
            issueDate: (feDoc.authDate || new Date()).toISOString().split('T')[0],
            cufe: feDoc.cufe || 'PENDIENTE DE AUTORIZACIÓN',
            qrUrl: feDoc.qrUrl,
            customer: {
                name: order.customer.name,
                ruc: order.customer.taxId,
                address: order.customer.address
            },
            items: formattedItems,
            issuer: issuerConfig,
            totals: calculateTaxes(formattedItems)
        };

        const pdfBuffer = await generateCafePdf(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=CAFE-${feDoc.cufe}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
