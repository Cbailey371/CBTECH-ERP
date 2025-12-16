const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const {
    PurchaseOrder,
    Supplier,
    Quotation,
    Customer,
    Product,
    Contract,
    Company
} = require('../models');
const { authenticateToken } = require('../middleware/auth');

// --- Schema Definition ---
// Defines available fields and relations for each entity type.
const SCHEMA = {
    'sales': {
        model: Quotation,
        label: 'Ventas (Cotizaciones)',
        include: [{ model: Customer, as: 'customer', attributes: ['name', 'email', 'taxId'] }],
        fields: {
            'number': { label: 'Número', type: 'string' },
            'date': { label: 'Fecha', type: 'date' },
            'status': { label: 'Estado', type: 'enum', options: ['draft', 'sent', 'accepted', 'rejected'] },
            'customer.name': { label: 'Cliente', type: 'string', relation: 'customer' },
            'customer.taxId': { label: 'RUC Cliente', type: 'string', relation: 'customer' },
            'subtotal': { label: 'Subtotal', type: 'currency' },
            'tax': { label: 'Impuesto', type: 'currency' },
            'total': { label: 'Total', type: 'currency' },
            'validUntil': { label: 'Válida Hasta', type: 'date' }
        },
        defaultSort: 'date'
    },
    'purchases': {
        model: PurchaseOrder,
        label: 'Compras',
        include: [{ model: Supplier, as: 'supplier', attributes: ['name', 'email', 'ruc'] }],
        fields: {
            'orderNumber': { label: 'Número', type: 'string' },
            'issueDate': { label: 'Fecha Emisión', type: 'date' },
            'deliveryDate': { label: 'Fecha Entrega', type: 'date' },
            'status': { label: 'Estado', type: 'enum', options: ['draft', 'approved', 'sent', 'received', 'finalized', 'cancelled'] },
            'supplier.name': { label: 'Proveedor', type: 'string', relation: 'supplier' },
            'supplier.ruc': { label: 'RUC Proveedor', type: 'string', relation: 'supplier' },
            'subtotal': { label: 'Subtotal', type: 'currency' },
            'taxTotal': { label: 'Impuesto', type: 'currency' },
            'total': { label: 'Total', type: 'currency' },
            'paymentTerms': { label: 'Términos', type: 'string' }
        },
        defaultSort: 'issueDate'
    },
    'contracts': {
        model: Contract,
        label: 'Contratos',
        include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
        fields: {
            'code': { label: 'Código', type: 'string' },
            'title': { label: 'Título', type: 'string' },
            'status': { label: 'Estado', type: 'enum', options: ['draft', 'active', 'suspended', 'expired', 'terminated', 'renewed', 'cancelled'] },
            'customer.name': { label: 'Cliente', type: 'string', relation: 'customer' },
            'startDate': { label: 'Fecha Inicio', type: 'date' },
            'endDate': { label: 'Fecha Fin', type: 'date' },
            'value': { label: 'Valor', type: 'currency' },
            'renewalType': { label: 'Renovación', type: 'enum', options: ['manual', 'auto'] },
            'billingCycle': { label: 'Facturación', type: 'enum', options: ['monthly', 'quarterly', 'yearly', 'one_time'] }
        },
        defaultSort: 'startDate'
    },
    'products': {
        model: Product,
        label: 'Productos',
        include: [],
        fields: {
            'code': { label: 'Código', type: 'string' },
            'sku': { label: 'SKU', type: 'string' },
            'description': { label: 'Descripción / Nombre', type: 'string' },
            'price': { label: 'Precio', type: 'currency' },
            'cost': { label: 'Costo', type: 'currency' },
            'isActive': { label: 'Activo', type: 'boolean' }
        },
        defaultSort: 'description'
    },
    'customers': {
        model: Customer,
        label: 'Clientes',
        include: [],
        fields: {
            'name': { label: 'Nombre', type: 'string' },
            'taxId': { label: 'RUC/ID', type: 'string' },
            'email': { label: 'Email', type: 'string' },
            'phone': { label: 'Teléfono', type: 'string' },
            'address': { label: 'Dirección', type: 'string' },
            'type': { label: 'Tipo', type: 'enum', options: ['individual', 'corporate'] }
        },
        defaultSort: 'name'
    },
    'suppliers': {
        model: Supplier,
        label: 'Proveedores',
        include: [],
        fields: {
            'name': { label: 'Nombre', type: 'string' },
            'ruc': { label: 'RUC/ID', type: 'string' },
            'email': { label: 'Email', type: 'string' },
            'phone': { label: 'Teléfono', type: 'string' },
            'address': { label: 'Dirección', type: 'string' },
            'paymentTerms': { label: 'Términos', type: 'string' }
        },
        defaultSort: 'name'
    }
};

// Helper: Build dynamic where clause
const buildDynamicWhere = (entityConfig, filters = [], companyId) => {
    const where = { companyId };
    const includeOptions = {}; // Map of relation name -> include object

    // Initialize includes from config to support modification
    if (entityConfig.include) {
        entityConfig.include.forEach(inc => {
            const as = inc.as;
            includeOptions[as] = { ...inc, where: {}, required: false }; // Default left join
        });
    }

    // filters: [{ field, operator, value }]
    if (Array.isArray(filters)) {
        filters.forEach(f => {
            const fieldConfig = entityConfig.fields[f.field];
            if (!fieldConfig) return;

            let op;
            switch (f.operator) {
                case 'eq': op = Op.eq; break;
                case 'ne': op = Op.ne; break;
                case 'gt': op = Op.gt; break;
                case 'gte': op = Op.gte; break;
                case 'lt': op = Op.lt; break;
                case 'lte': op = Op.lte; break;
                case 'like': op = Op.iLike; break;
                default: op = Op.eq;
            }

            let val = f.value;
            if (f.operator === 'like') val = `%${val}%`;

            if (fieldConfig.relation) {
                // It's a relation field (e.g. customer.name)
                // We need to apply this filter to the included model
                const relationName = fieldConfig.relation;
                const fieldName = String(f.field).split('.').pop(); // "name" from "customer.name"

                if (includeOptions[relationName]) {
                    includeOptions[relationName].where[fieldName] = { [op]: val };
                    includeOptions[relationName].required = true; // Inner join if filtering
                }
            } else {
                // Main model field
                where[f.field] = { [op]: val };
            }
        });
    }

    return { where, finalIncludes: Object.values(includeOptions) };
};


// GET /api/reports/schema/:entity
router.get('/schema/:entity', authenticateToken, (req, res) => {
    const { entity } = req.params;
    if (!SCHEMA[entity]) {
        return res.status(404).json({ message: 'Entity not found' });
    }

    // Return schema suitable for frontend builder
    const config = SCHEMA[entity];
    const fields = Object.entries(config.fields).map(([key, def]) => ({
        key,
        label: def.label,
        type: def.type,
        options: def.options
    }));

    res.json({
        entity,
        label: config.label,
        fields
    });
});

// POST /api/reports/generate
router.post('/generate', authenticateToken, async (req, res) => {
    try {
        const { entity, filters = [], columns = [], companyId: bodyCompanyId } = req.body;
        const companyId = req.user.companyId || req.headers['x-company-id'] || bodyCompanyId;

        if (!SCHEMA[entity]) {
            return res.status(400).json({ message: 'Invalid entity type' });
        }

        const config = SCHEMA[entity];
        const { where, finalIncludes } = buildDynamicWhere(config, filters, companyId);

        // Determine includes based on requested columns
        // (Currently simply including all defined relations to be safe/simple)

        const data = await config.model.findAll({
            where,
            include: finalIncludes,
            limit: 100,
            order: config.defaultSort ? [[config.defaultSort, 'DESC']] : undefined
        });

        res.json({ success: true, data });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ message: error.message, error: error.toString() });
    }
});

// POST /api/reports/export
router.post('/export', authenticateToken, async (req, res) => {
    try {
        const { entity, format, filters = [], columns = [], companyId: bodyCompanyId } = req.body;
        const companyId = req.user.companyId || req.headers['x-company-id'] || bodyCompanyId;

        if (!SCHEMA[entity]) {
            return res.status(400).json({ message: 'Invalid entity type' });
        }

        const config = SCHEMA[entity];
        const { where, finalIncludes } = buildDynamicWhere(config, filters, companyId);

        const data = await config.model.findAll({
            where,
            include: finalIncludes,
            order: config.defaultSort ? [[config.defaultSort, 'DESC']] : undefined
        });

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            // Columns from request (frontend provides label/key)
            worksheet.columns = columns.map(col => ({
                header: col.label,
                key: col.key,
                width: 20
            }));

            // Rows
            data.forEach(item => {
                const row = {};
                columns.forEach(col => {
                    const keys = col.key.split('.');
                    let value = item;
                    for (const k of keys) {
                        if (value === null || value === undefined) break;
                        value = value[k];
                    }
                    // Format dates/currency if needed
                    row[col.key] = value;
                });
                worksheet.addRow(row);
            });

            worksheet.getRow(1).font = { bold: true };
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=report-${entity}-${Date.now()}.xlsx`);
            await workbook.xlsx.write(res);
            res.end();

        } else if (format === 'csv') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');
            worksheet.columns = columns.map(col => ({ header: col.label, key: col.key }));

            data.forEach(item => {
                const row = {};
                columns.forEach(col => {
                    const keys = col.key.split('.');
                    let value = item;
                    for (const k of keys) {
                        if (value === null || value === undefined) break;
                        value = value[k];
                    }
                    row[col.key] = value;
                });
                worksheet.addRow(row);
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=report-${entity}-${Date.now()}.csv`);
            await workbook.csv.write(res);
            res.end();
        } else {
            res.status(400).json({ message: 'Invalid format' });
        }

    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({ message: error.message, error: error.toString() });
    }
});

module.exports = router;
