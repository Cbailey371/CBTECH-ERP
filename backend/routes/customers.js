const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Customer = require('../models/Customer');
const { authenticateToken } = require('../middleware/auth');
const {
  companyContext,
  requireCompanyContext,
  requireCompanyPermission,
  getCompanyFilter
} = require('../middleware/companyContext');
const { generateCode } = require('../utils/codeGenerator');

// Aplicar middleware de autenticación y contexto de empresa a todas las rutas
router.use(authenticateToken);
router.use(companyContext);

// GET /api/customers - Obtener clientes (con filtrado automático por empresa)
router.get('/', requireCompanyContext, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      is_active
    } = req.query;

    // Construir filtros WHERE con filtrado automático por empresa
    const whereClause = {
      ...getCompanyFilter(req), // Filtro automático por empresa
    };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { taxId: { [Op.iLike]: `%${search}%` } },
        { tradeName: { [Op.iLike]: `%${search}%` } },
        { dv: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (is_active !== undefined) {
      whereClause.isActive = is_active === 'true';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      customers: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      },
      company: {
        id: req.companyContext.companyId,
        name: req.companyContext.company.name
      }
    });

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/customers/:id - Obtener cliente específico
router.get('/:id', requireCompanyContext, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        ...getCompanyFilter(req) // Filtro automático por empresa
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      customer
    });

  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/customers - Crear nuevo cliente
router.post('/', requireCompanyContext, requireCompanyPermission(['customers.create'], 'user'), async (req, res) => {
  try {
    const {
      name,
      tradeName,
      email,
      phone,
      address,
      taxId,
      dv,
      notes,
      customerType,
      isActive
    } = req.body;

    // Validar campos requeridos
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es requerido'
      });
    }

    if (!tradeName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre comercial es requerido'
      });
    }

    if (!taxId) {
      return res.status(400).json({
        success: false,
        message: 'El RUC es requerido'
      });
    }

    if (!dv) {
      return res.status(400).json({
        success: false,
        message: 'El dígito verificador (DV) es requerido'
      });
    }

    // Verificar que el email no exista en la misma empresa
    if (email) {
      const existingCustomer = await Customer.findOne({
        where: {
          email,
          ...getCompanyFilter(req) // Filtro automático por empresa
        }
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con ese email en esta empresa'
        });
      }
    }

    // Verificar RUC + DV único en la empresa
    const taxIdNormalized = String(taxId).trim();
    const dvNormalized = String(dv).trim().toUpperCase();
    const existingTaxId = await Customer.findOne({
      where: {
        taxId: taxIdNormalized,
        dv: dvNormalized,
        ...getCompanyFilter(req)
      }
    });

    if (existingTaxId) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cliente con ese RUC y DV en esta empresa'
      });
    }

    // Crear cliente con companyId automático
    let customerCode = req.body.code;
    if (!customerCode) {
      customerCode = await generateCode(Customer, 'CLI', { companyId: req.companyContext.companyId }, 3);
    }

    const customer = await Customer.create({
      companyId: req.companyContext.companyId,
      code: customerCode,
      name,
      tradeName, // Kept tradeName
      email,
      phone,
      address: address || null,
      taxId: taxIdNormalized, // Used normalized taxId
      dv: dvNormalized, // Used normalized dv
      notes, // Kept notes
      customerType: customerType || 'business',
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      customer
    });

  } catch (error) {
    console.error('Error al crear cliente:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/customers/:id - Actualizar cliente
router.put('/:id', requireCompanyContext, requireCompanyPermission(['customers.update'], 'user'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        ...getCompanyFilter(req) // Filtro automático por empresa
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const {
      name,
      tradeName,
      email,
      phone,
      address,
      taxId,
      dv,
      isActive,
      notes
    } = req.body;

    // Verificar email único en la empresa si se cambia
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        where: {
          email,
          id: { [Op.ne]: customer.id },
          ...getCompanyFilter(req)
        }
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con ese email en esta empresa'
        });
      }
    }

    // Verificar RUC + DV único si se modifican
    let dvNormalized = customer.dv;
    if (dv !== undefined) {
      dvNormalized = String(dv).trim().toUpperCase();
    }

    const taxIdNormalizedUpdate = taxId !== undefined ? String(taxId).trim() : customer.taxId;

    if ((taxId && taxIdNormalizedUpdate !== customer.taxId) || (dv !== undefined && dvNormalized !== customer.dv)) {
      const taxIdExists = await Customer.findOne({
        where: {
          taxId: taxIdNormalizedUpdate,
          dv: dvNormalized,
          id: { [Op.ne]: customer.id },
          ...getCompanyFilter(req)
        }
      });

      if (taxIdExists) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con ese RUC y DV en esta empresa'
        });
      }
    }

    // Actualizar cliente
    await customer.update({
      name: name !== undefined ? name : customer.name,
      tradeName: tradeName !== undefined ? tradeName : customer.tradeName,
      email: email !== undefined ? email : customer.email,
      phone: phone !== undefined ? phone : customer.phone,
      address: address !== undefined ? address : customer.address,
      taxId: taxId !== undefined ? taxIdNormalizedUpdate : customer.taxId,
      dv: dv !== undefined ? dvNormalized : customer.dv,
      isActive: isActive !== undefined ? isActive : customer.isActive,
      notes: notes !== undefined ? notes : customer.notes
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      customer
    });

  } catch (error) {
    console.error('Error al actualizar cliente:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PATCH /api/customers/:id/status - Actualizar estado activo
router.patch('/:id/status', requireCompanyContext, requireCompanyPermission(['customers.update'], 'user'), async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El estado es inválido'
      });
    }

    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        ...getCompanyFilter(req)
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    await customer.update({ isActive });

    res.json({
      success: true,
      message: `Cliente ${isActive ? 'activado' : 'desactivado'} exitosamente`,
      customer
    });
  } catch (error) {
    console.error('Error al actualizar estado del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/customers/:id - Eliminar cliente
router.delete('/:id', requireCompanyContext, requireCompanyPermission(['customers.delete'], 'manager'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: {
        id: req.params.id,
        ...getCompanyFilter(req) // Filtro automático por empresa
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    await customer.destroy();

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
