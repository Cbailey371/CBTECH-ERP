const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Supplier } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const {
    companyContext,
    requireCompanyContext,
    requireCompanyPermission,
    getCompanyFilter
} = require('../middleware/companyContext');
const { generateCode } = require('../utils/codeGenerator');

// Aplicar middleware de autenticación y contexto de empresa
router.use(authenticateToken);
router.use(companyContext);

// GET /api/suppliers - Listar proveedores
router.get('/', requireCompanyContext, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', is_active } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {
            ...getCompanyFilter(req)
        };

        console.log('GET /suppliers query:', req.query);
        console.log('Where clause:', whereClause);

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { ruc: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { contactName: { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (is_active !== undefined && is_active !== null && is_active !== '') {
            whereClause.isActive = is_active === 'true';
        }

        const { count, rows } = await Supplier.findAndCountAll({
            where: whereClause,
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            suppliers: rows,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(count / limit),
                total_items: count,
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al listar proveedores:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// GET /api/suppliers/:id - Obtener detalle
router.get('/:id', requireCompanyContext, async (req, res) => {
    try {
        const supplier = await Supplier.findOne({
            where: {
                id: req.params.id,
                ...getCompanyFilter(req)
            }
        });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }

        res.json({ success: true, supplier });

    } catch (error) {
        console.error('Error al obtener proveedor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// POST /api/suppliers - Crear proveedor
router.post('/', requireCompanyContext, requireCompanyPermission(['suppliers.create'], 'user'), async (req, res) => {
    try {
        const {
            name,
            ruc,
            dv,
            email,
            phone,
            address,
            contactName,
            paymentTerms,
            notes
        } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
        }

        // Check RUC uniqueness within company if provided
        if (ruc) {
            const existing = await Supplier.findOne({
                where: {
                    ruc,
                    ...getCompanyFilter(req)
                }
            });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Ya existe un proveedor con ese RUC' });
            }
        }

        console.log('Creating supplier for company:', req.companyContext.companyId);

        let supplierCode = req.body.code;
        if (!supplierCode) {
            supplierCode = await generateCode(Supplier, 'PROV', { companyId: req.companyContext.companyId }, 3);
        }

        const supplier = await Supplier.create({
            code: supplierCode,
            companyId: req.companyContext.companyId,
            name,
            ruc,
            dv,
            email,
            phone,
            address,
            contactName,
            paymentTerms,
            notes,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Proveedor creado exitosamente',
            supplier
        });

    } catch (error) {
        console.error('Error al crear proveedor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// PUT /api/suppliers/:id - Actualizar proveedor
router.put('/:id', requireCompanyContext, requireCompanyPermission(['suppliers.update'], 'user'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            ruc,
            dv,
            email,
            phone,
            address,
            contactName,
            paymentTerms,
            isActive,
            notes
        } = req.body;

        const supplier = await Supplier.findOne({
            where: {
                id,
                ...getCompanyFilter(req)
            }
        });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }

        // Check RUC duplication
        if (ruc && ruc !== supplier.ruc) {
            const existing = await Supplier.findOne({
                where: {
                    ruc,
                    id: { [Op.ne]: id },
                    ...getCompanyFilter(req)
                }
            });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Ya existe otro proveedor con ese RUC' });
            }
        }

        await supplier.update({
            name,
            ruc,
            dv,
            email,
            phone,
            address,
            contactName,
            paymentTerms,
            isActive,
            notes
        });

        res.json({
            success: true,
            message: 'Proveedor actualizado exitosamente',
            supplier
        });

    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// DELETE /api/suppliers/:id - Eliminar (Soft delete preferred usually, looking at others it's destroy)
// We will use destroy but maybe we should use isActive = false? following pattern of customers delete is destroy.
router.delete('/:id', requireCompanyContext, requireCompanyPermission(['suppliers.delete'], 'manager'), async (req, res) => {
    try {
        const supplier = await Supplier.findOne({
            where: {
                id: req.params.id,
                ...getCompanyFilter(req)
            }
        });

        if (!supplier) {
            return res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
        }

        await supplier.destroy();

        res.json({ success: true, message: 'Proveedor eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

module.exports = router;
