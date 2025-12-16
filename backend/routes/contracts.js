const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const { sequelize, Contract, Customer, Company } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const {
    companyContext,
    requireCompanyContext,
    requireCompanyPermission,
    getCompanyFilter
} = require('../middleware/companyContext');
const { generateCode } = require('../utils/codeGenerator');

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'contract-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            // 'text/plain', 'image/jpeg', 'image/png' // if needed
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no válido. Solo PDF y Word.'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware global
router.use(authenticateToken);
router.use(companyContext);

// GET /api/contracts - Listar contratos
router.get('/', requireCompanyContext, requireCompanyPermission(['contracts.read'], 'user'), async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status, customerId, expiringSoon } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const whereClause = {
            ...getCompanyFilter(req)
        };

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.iLike]: `%${search}%` } },
                { description: { [Op.iLike]: `%${search}%` } },
                { '$customer.name$': { [Op.iLike]: `%${search}%` } }
            ];
        }

        if (status) {
            whereClause.status = status;
        }

        if (customerId) {
            whereClause.customerId = customerId;
        }

        if (expiringSoon === 'true') {
            const today = new Date();
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(today.getDate() + 30);

            whereClause.endDate = {
                [Op.between]: [today, thirtyDaysLater]
            };

            if (!status) {
                whereClause.status = 'active';
            }
        }

        const { count, rows } = await Contract.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'name', 'email']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            contracts: rows,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(count / limit),
                total_items: count,
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error al listar contratos:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// GET /api/contracts/:id - Obtener detalle
router.get('/:id', requireCompanyContext, requireCompanyPermission(['contracts.read'], 'user'), async (req, res) => {
    try {
        const contract = await Contract.findOne({
            where: {
                id: req.params.id,
                ...getCompanyFilter(req)
            },
            include: [
                {
                    model: Customer,
                    as: 'customer'
                }
            ]
        });

        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
        }

        res.json({ success: true, contract });

    } catch (error) {
        console.error('Error al obtener contrato:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// POST /api/contracts - Crear contrato (con archivo)
router.post('/', requireCompanyContext, requireCompanyPermission(['contracts.create'], 'user'), upload.single('file'), async (req, res) => {
    try {
        const {
            customerId,
            title,
            description,
            status,
            startDate,
            endDate,
            value,
            billingCycle,
            slaDetails,
            renewalType
        } = req.body;

        // Note: When using Multer, non-file fields are in req.body

        if (!customerId || !title || !startDate) {
            return res.status(400).json({ success: false, message: 'Campos obligatorios faltantes (Cliente, Título, Fecha Inicio)' });
        }

        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const { generateCode } = require('../utils/codeGenerator'); // Moved inside route as per instruction

        let contractCode = req.body.code;
        if (!contractCode) {
            contractCode = await generateCode(Contract, 'CONT', { companyId: req.companyContext.companyId }, 4, true);
        }

        const contract = await Contract.create({
            code: contractCode, // Added contract code
            companyId: req.companyContext.companyId,
            customerId,
            title,
            description,
            status: status || 'draft',
            startDate,
            endDate: endDate || null,
            value: value || 0,
            billingCycle: billingCycle || 'monthly',
            slaDetails,
            renewalType: renewalType || 'manual',
            fileUrl,
            createdBy: req.user.id // Added createdBy
        });

        const createdContract = await Contract.findByPk(contract.id, {
            include: ['customer']
        });

        res.status(201).json({
            success: true,
            message: 'Contrato creado exitosamente',
            contract: createdContract
        });

    } catch (error) {
        console.error('Error al crear contrato:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
    }
});

// PUT /api/contracts/:id - Actualizar contrato (con archivo)
router.put('/:id', requireCompanyContext, requireCompanyPermission(['contracts.update'], 'user'), upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customerId,
            title,
            description,
            status,
            startDate,
            endDate,
            value,
            billingCycle,
            slaDetails,
            renewalType
        } = req.body;

        const contract = await Contract.findOne({
            where: {
                id,
                ...getCompanyFilter(req)
            }
        });

        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
        }

        const updateData = {
            title,
            description,
            status,
            startDate,
            endDate: endDate || null, // Handle explicit null/empty string
            value,
            billingCycle,
            slaDetails,
            renewalType
        };

        if (customerId) updateData.customerId = customerId;
        if (req.file) {
            updateData.fileUrl = `/uploads/${req.file.filename}`;
        }

        await contract.update(updateData);

        const updatedContract = await Contract.findByPk(id, {
            include: ['customer']
        });

        res.json({
            success: true,
            message: 'Contrato actualizado exitosamente',
            contract: updatedContract
        });

    } catch (error) {
        console.error('Error al actualizar contrato:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// DELETE /api/contracts/:id - Eliminar contrato
router.delete('/:id', requireCompanyContext, requireCompanyPermission(['contracts.delete'], 'manager'), async (req, res) => {
    try {
        const contract = await Contract.findOne({
            where: {
                id: req.params.id,
                ...getCompanyFilter(req)
            }
        });

        if (!contract) {
            return res.status(404).json({ success: false, message: 'Contrato no encontrado' });
        }

        await contract.destroy();

        res.json({ success: true, message: 'Contrato eliminado exitosamente' });

    } catch (error) {
        console.error('Error al eliminar contrato:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

module.exports = router;
