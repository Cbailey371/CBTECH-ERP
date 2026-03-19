const { 
    sequelize, 
    FE_IssuerConfig, 
    FE_Document, 
    SalesOrder, 
    SalesOrderItem, 
    Customer, 
    Company,
    Product 
} = require('../../models');
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
            cufe: result.cufe,
            qrUrl: result.qr,
            xmlSigned: result.xmlSigned,
            htmlContent: result.htmlContent, // Guardamos el HTML oficial de Digifact
            pdfContent: result.pdfBase64,  // Guardamos el PDF oficial de Digifact
            authDate: result.issuedTimeStamp ? new Date(result.issuedTimeStamp) : new Date(),
            status: 'AUTHORIZED',
            pacName: 'DIGIFACT',
            protocol: result.protocol,
            environment: issuerConfig.environment,
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
        const id = req.params.id || req.query.id; // Support both path and query param
        console.log(`[FE_DOWNLOAD] Request received. ID: ${id}, User: ${req.user?.id}, Method: ${req.method}`);
        
        if (!id) {
            return res.status(400).json({ success: false, message: 'ID de documento requerido' });
        }
        const feDoc = await FE_Document.findByPk(id, {
            include: [{
                model: SalesOrder,
                as: 'salesOrder',
                include: [
                    { model: Customer, as: 'customer' },
                    { 
                        model: SalesOrderItem, 
                        as: 'items',
                        include: [{ model: Product, as: 'product' }]
                    }
                ]
            }]
        });

        if (!feDoc) return res.status(404).json({ error: 'Documento no encontrado' });

        const issuerConfig = await FE_IssuerConfig.findOne({ where: { companyId: feDoc.companyId } });
        const order = feDoc.salesOrder;
        const items = order ? (order.items || []) : [];

        // Obtener logo de la compañía si existe
        const company = await Company.findByPk(feDoc.companyId);
        let logoBuffer = null;
        if (company && company.documentLogo) {
            if (company.documentLogo.startsWith('data:image')) {
                logoBuffer = company.documentLogo;
            } else if (company.documentLogo.startsWith('http')) {
                // Si es URL, intentamos obtener el base64 simple (opcionalmente podríamos usar una librería, 
                // pero para evitar dependencias, si es URL la pasamos tal cual si pdfmake la soporta o la ignoramos)
                // pdfmake NO soporta URLs directamente en node de forma confiable sin axios/fetch.
                // Como tenemos node-fetch en package.json, usémoslo.
                try {
                    const fetch = require('node-fetch');
                    const response = await fetch(company.documentLogo);
                    const buffer = await response.buffer();
                    logoBuffer = `data:image/png;base64,${buffer.toString('base64')}`;
                } catch (e) {
                    console.error('Error fetching terminal logo:', e.message);
                }
            }
        }

        // Si no hay HTML (PACs antiguos o errores), generamos el PDF interno como fallback
        const formattedItems = items.map((i, index) => ({
            no: index + 1,
            description: i.description || (i.product ? i.product.name : 'Producto'),
            quantity: parseFloat(i.quantity) || 0,
            uom: i.product?.unitOfMeasure || 'und',
            code: i.product?.itemCode || '',
            price: parseFloat(i.unitPrice) || 0,
            total: parseFloat(i.total) || 0,
            taxRate: parseFloat(i.taxRate) || 0,
            discount: parseFloat(i.discount) || 0
        }));

        const data = {
            docType: feDoc.docType || '01',
            documentNumber: order.orderNumber,
            issueDate: (feDoc.authDate || new Date()).toISOString().split('T')[0],
            cufe: feDoc.cufe || 'PENDIENTE DE AUTORIZACIÓN',
            qrUrl: feDoc.qrUrl,
            protocol: feDoc.protocol || feDoc.rejectionReason, 
            customer: {
                name: order.customer.name,
                ruc: order.customer.taxId,
                address: order.customer.address,
                email: order.customer.email,
                phone: order.customer.phone
            },
            items: formattedItems,
            issuer: issuerConfig,
            logo: logoBuffer,
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
