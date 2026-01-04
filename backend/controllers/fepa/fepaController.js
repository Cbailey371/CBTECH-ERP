const { sequelize } = require('../../config/database');
const FE_IssuerConfig = require('../../models/FE_IssuerConfig');
const FE_Document = require('../../models/FE_Document');
const SalesOrder = require('../../models/SalesOrder');
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

        const order = await SalesOrder.findOne({
            where: { id: orderId, companyId },
            include: [{ model: Customer, as: 'customer' }] // Adjust alias if needed
            // TODO: Include Items. Requires SalesOrder -> Items relationship to be checked.
        });

        if (!order) return res.status(404).json({ error: 'Orden no encontrada.' });

        // 2. Prepare Data (Normalize)
        // Need to fetch items if not included above (assuming functional getItems or similar)
        // For this demo, assuming order.items is populated or we fetch them manually.
        const items = await order.getItems(); // Sequelize method if relationship 'hasMany' exists

        const docData = {
            documentNumber: order.orderNumber,
            docType: '01', // Factura
            issueDate: new Date(),
            items: items.map(i => ({
                description: i.description || i.productName, // Check your SalesOrderItem model
                quantity: i.quantity,
                price: i.unitPrice,
                total: i.total,
                taxRate: 0.07 // FIXME: Fetch real tax rate from product/item
            })),
            customer: {
                name: order.customer.name,
                ruc: order.customer.taxId || 'CONSUMIDOR FINAL', // Check Customer model field
                address: order.customer.address
            },
            // Metadata for PDF
            issuer: issuerConfig,
            totals: calculateTaxes(items.map(i => ({ ...i.toJSON(), taxRate: 0.07 }))) // Recalculate or use stored totals
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
            authDate: result.authDate,
            rejectionReason: result.error,
            pacName: issuerConfig.pacProvider,
            environment: issuerConfig.environment
        });

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
                include: [
                    { model: Customer, as: 'customer' }
                    // Include Items
                ]
            }]
        });

        if (!feDoc) return res.status(404).json({ error: 'Documento no encontrado' });

        const issuerConfig = await FE_IssuerConfig.findOne({ where: { companyId: feDoc.companyId } });
        const order = feDoc.SalesOrder;
        const items = await order.getItems();

        const data = {
            documentNumber: order.orderNumber,
            issueDate: feDoc.authDate?.toISOString().split('T')[0],
            cufe: feDoc.cufe,
            qrUrl: feDoc.qrUrl,
            customer: {
                name: order.customer.name,
                ruc: order.customer.taxId,
                address: order.customer.address
            },
            items: items.map(i => ({
                description: i.description,
                quantity: i.quantity,
                price: i.unitPrice,
                total: i.total,
                taxRate: 0.07
            })),
            issuer: issuerConfig,
            totals: calculateTaxes(items.map(i => ({ ...i.toJSON(), taxRate: 0.07 })))
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
