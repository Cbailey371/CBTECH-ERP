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

        const isExtranjeroVal = order.customer.tipoReceptor === '04' || (order.customer.paisReceptor && order.customer.paisReceptor !== 'PA');
        const docTypeVal = isExtranjeroVal ? '02' : '01';

        const docData = {
            documentNumber: order.orderNumber,
            docType: docTypeVal, 
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
            // Metadata for PDF
            issuer: issuerConfig,
            totals: calculateTaxes(items.map(i => ({ ...i.toJSON(), taxRate: parseFloat(i.taxRate) || 0 }))) // Recalculate using real tax rate
        };

        // 3. Select PAC & Send
        const pacAdapter = PACFactory.getAdapter(issuerConfig);
        const result = await pacAdapter.signAndSend(docData);

        // 4. Save FE_Document if Successful
        if (result.success && result.status === 'AUTHORIZED') {
            const feDoc = await FE_Document.create({
                companyId,
                salesOrderId: order.id,
                docType: docTypeVal,
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

            // 5. Update Sales Order Status
            await order.update({ status: 'fulfilled' });

            return res.json({ success: true, document: feDoc });
        } else {
            // Document Rejected by PAC
            return res.status(400).json({ 
                success: false, 
                status: 'REJECTED',
                error: result.error || 'Documento rechazado por el PAC sin motivo específico'
            });
        }

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
                try {
                    const fetch = require('node-fetch');
                                        const response = await fetch(company.documentLogo);
                    const buffer = await response.buffer();
                    logoBuffer = `data:image/png;base64,${buffer.toString('base64')}`;
                } catch (e) {
                    console.error('Error fetching logo:', e.message);
                }
            }
        }

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

        const totals = calculateTaxes(formattedItems);

        const data = {
            docType: feDoc.docType || '01',
            // El usuario solicita el número de factura completo (10 dígitos)
            documentNumber: String(order.orderNumber || '1').replace(/\D/g, '').slice(-10).padStart(10, '0'),
            issueDate: (feDoc.authDate || new Date()).toISOString().split('T')[0],
            cufe: feDoc.cufe || 'PENDIENTE DE AUTORIZACIÓN',
            protocol: feDoc.protocol || 'AUTORIZADO',
            customer: {
                name: order.customer.name,
                ruc: order.customer.taxId,
                address: order.customer.address,
                email: order.customer.email,
                phone: order.customer.phone,
                tipoReceptor: order.customer.tipoReceptor
            },
            items: formattedItems,
            // El usuario solicita el punto de facturación completo (usualmente 3 dígitos)
            issuer: {
                ...issuerConfig.toJSON(),
                puntoDeVenta: String(issuerConfig.puntoDeVenta || '001').padStart(3, '0')
            },
            logo: logoBuffer,
            totals: totals,
            isExtranjero: order.customer.tipoReceptor === '04' || (order.customer.paisReceptor && order.customer.paisReceptor !== 'PA')
        };

        // Reconstrucción del QR si no existe en la DB (para facturas antiguas)
        let finalQrUrl = feDoc.qrUrl;
        if (!finalQrUrl && feDoc.cufe && issuerConfig) {
            const rucStr = issuerConfig.ruc || '';
            const fechaStr = data.issueDate;
            const montoStr = totals.totalAmount.toFixed(2);
            finalQrUrl = `https://dgi-fep.mef.gob.pa/Consultas/FacturasPorCUFE?cufe=${feDoc.cufe}&ruc=${rucStr}&fecha=${fechaStr}&monto=${montoStr}`;
        }
        data.qrUrl = finalQrUrl;

        const { generateCafePdf } = require('../../services/pdf/cafeGenerator');
        
        // --- PRIORIDAD: Usar PDF oficial del proveedor (responseData3) ---
        if (feDoc.pdfContent) {
            console.log(`[FE_DOWNLOAD] Usando PDF (responseData3) del proveedor para: ${feDoc.cufe}`);
            const pdfBuffer = Buffer.from(feDoc.pdfContent, 'base64');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=CAFE-${feDoc.cufe}.pdf`);
            return res.send(pdfBuffer);
        }

        // --- SEGUNDA OPCIÓN: Usar HTML oficial si no hay PDF ---
        if (feDoc.htmlContent) {
            console.log(`[FE_DOWNLOAD] Usando HTML (responseData2) del proveedor para: ${feDoc.cufe}`);
            res.setHeader('Content-Type', 'text/html');
            return res.send(feDoc.htmlContent);
        }

        // --- FALLBACK: Solo si no hay nada guardado (documentos antiguos) ---
        console.log(`[FE_DOWNLOAD] No se encontró contenido del proveedor, generando formato local para: ${feDoc.cufe}`);
        const pdfBuffer = await generateCafePdf(data);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=CAFE-${feDoc.cufe}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
