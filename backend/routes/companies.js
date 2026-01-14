const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Company = require('../models/company');
const { authenticateToken, authorize } = require('../middleware/auth');
const { generateCode } = require('../utils/codeGenerator');

// Middleware para verificar permisos de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

// GET /api/companies - Obtener todas las empresas
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      is_active,
      is_main_company,
      country,
      tax_regime,
      sort_by = 'name',
      sort_order = 'ASC'
    } = req.query;

    // Construir filtros WHERE
    const whereClause = {};

    if (search) {
      console.log('🔍 Aplicando filtro de búsqueda:', search);
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { legalName: { [Op.iLike]: `%${search}%` } },
        { tradeName: { [Op.iLike]: `%${search}%` } },
        { taxId: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (is_active !== undefined) {
      whereClause.isActive = is_active === 'true';
    }

    if (is_main_company !== undefined) {
      whereClause.isMainCompany = is_main_company === 'true';
    }

    if (country) {
      whereClause.country = { [Op.iLike]: `% ${country}% ` };
    }

    // Validar y construir orden
    const validSortFields = ['name', 'legalName', 'taxId', 'email', 'city', 'country', 'created_at', 'updated_at'];
    const orderField = validSortFields.includes(sort_by) ? sort_by : 'name';
    const orderDirection = sort_order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [[orderField, orderDirection]],
      attributes: { exclude: ['notes'] } // Excluir notas en el listado
    });

    console.log(`📊 Devueltas ${rows.length} empresas de un total de ${count}`);

    res.json({
      success: true,
      data: {
        companies: rows,
        total: count,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener empresas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/companies/:id - Obtener una empresa específica
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    res.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error('Error al obtener empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/companies/main/company - Obtener la empresa principal
router.get('/main/company', authenticateToken, async (req, res) => {
  try {
    const mainCompany = await Company.getMainCompany();

    if (!mainCompany) {
      return res.status(404).json({ message: 'No se encontró empresa principal' });
    }

    res.json({ company: mainCompany });

  } catch (error) {
    console.error('Error al obtener empresa principal:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/companies - Crear nueva empresa
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      legal_name,
      trade_name,
      tax_id,
      tax_id_type = 'RUC',
      verification_digit,
      dv, // Added dv
      email,
      phone,
      mobile,
      website,
      industry,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country = 'Panamá',
      default_currency = 'PAB',
      timezone = 'America/Panama',
      tax_name = 'ITBMS',
      tax_rate = 0.07,
      is_main_company = false,
      is_active = true,
      notes
    } = req.body;

    // Validar campos requeridos
    if (!name || !legal_name || !tax_id || !email || !address_line1 || !city) {
      return res.status(400).json({
        message: 'Campos requeridos: name, legal_name, tax_id, email, address_line1, city'
      });
    }

    // Verificar que el tax_id no exista
    const existingCompany = await Company.findOne({ where: { taxId: tax_id } });
    if (existingCompany) {
      return res.status(400).json({ message: 'Ya existe una empresa con ese número de identificación fiscal' });
    }

    // Crear la empresa
    let companyCode = req.body.code;
    if (!companyCode) {
      companyCode = await generateCode(Company, 'EMP', {}, 3); // Global scope, no where clause needed
    }

    const company = await Company.create({
      code: companyCode, // Added companyCode
      name,
      legalName: legal_name,
      tradeName: trade_name,
      taxId: tax_id,
      taxIdType: tax_id_type,
      verificationDigit: verification_digit,
      dv, // Added dv
      email,
      phone,
      mobile,
      website,
      industry,
      addressLine1: address_line1,
      addressLine2: address_line2,
      city,
      stateProvince: state_province,
      postalCode: postal_code,
      country,
      defaultCurrency: default_currency,
      timezone,
      taxName: tax_name,
      taxRate: tax_rate,
      isMainCompany: is_main_company,
      isActive: is_active,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      company
    });

  } catch (error) {
    console.error('Error al crear empresa:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.message.includes('Solo puede existir una empresa principal')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔧 PUT /companies/:id - Datos recibidos:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Dirección recibida (address_line1):', req.body.address_line1);
    console.log('🔍 Descripción recibida (notes):', req.body.notes);

    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    const {
      name,
      legal_name,
      trade_name,
      tax_id,
      tax_id_type,
      verification_digit,
      dv,
      email,
      phone,
      mobile,
      website,
      industry,
      address_line1,
      address_line2,
      city,
      state_province,
      postal_code,
      country,
      default_currency,
      timezone,
      tax_name,
      tax_rate,
      is_main_company,
      is_active,
      notes
    } = req.body;

    // Verificar que el tax_id no exista en otra empresa
    if (tax_id && tax_id !== company.taxId) {
      const existingCompany = await Company.findOne({
        where: {
          taxId: tax_id,
          id: { [Op.ne]: company.id }
        }
      });
      if (existingCompany) {
        return res.status(400).json({ message: 'Ya existe una empresa con ese número de identificación fiscal' });
      }
    }

    // Actualizar campos
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (legal_name !== undefined) updateData.legalName = legal_name;
    if (trade_name !== undefined) updateData.tradeName = trade_name;
    if (tax_id !== undefined) updateData.taxId = tax_id;
    if (tax_id_type !== undefined) updateData.taxIdType = tax_id_type;
    if (verification_digit !== undefined) updateData.verificationDigit = verification_digit;
    if (dv !== undefined) updateData.dv = dv;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (website !== undefined) updateData.website = website;
    if (industry !== undefined) updateData.industry = industry;
    if (address_line1 !== undefined) updateData.addressLine1 = address_line1;
    if (address_line2 !== undefined) updateData.addressLine2 = address_line2;
    if (city !== undefined) updateData.city = city;
    if (state_province !== undefined) updateData.stateProvince = state_province;
    if (postal_code !== undefined) updateData.postalCode = postal_code;
    if (country !== undefined) updateData.country = country;
    if (default_currency !== undefined) updateData.defaultCurrency = default_currency;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (tax_name !== undefined) updateData.taxName = tax_name;
    if (tax_rate !== undefined) updateData.taxRate = tax_rate;
    if (is_main_company !== undefined) updateData.isMainCompany = is_main_company;
    if (is_active !== undefined) updateData.isActive = is_active;
    if (notes !== undefined) updateData.notes = notes;

    console.log('📝 Datos para actualizar:', JSON.stringify(updateData, null, 2));
    console.log('🔍 ESPECÍFICO - notes en updateData:', updateData.notes);
    console.log('🔍 ESPECÍFICO - address_line1 en updateData:', updateData.addressLine1);

    await company.update(updateData);

    console.log('✅ Empresa actualizada exitosamente');

    // Obtener la empresa actualizada
    const updatedCompany = await Company.findByPk(req.params.id);

    console.log('📊 Empresa después de actualización:', JSON.stringify(updatedCompany.toJSON(), null, 2));

    res.json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      company: updatedCompany
    });

  } catch (error) {
    console.error('Error al actualizar empresa:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    if (error.message.includes('Solo puede existir una empresa principal')) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PATCH /api/companies/:id/toggle-status - Cambiar estado activo/inactivo
router.patch('/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // No permitir desactivar la empresa principal
    if (company.isMainCompany && company.isActive) {
      return res.status(400).json({ message: 'No se puede desactivar la empresa principal' });
    }

    await company.update({ isActive: !company.isActive });

    res.json({
      message: `Empresa ${company.isActive ? 'activada' : 'desactivada'} exitosamente`,
      company
    });

  } catch (error) {
    console.error('Error al cambiar estado de empresa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/companies/:id - Eliminar empresa
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // No permitir eliminar la empresa principal
    if (company.isMainCompany) {
      return res.status(400).json({ message: 'No se puede eliminar la empresa principal' });
    }

    // TODO: Verificar dependencias (facturas, usuarios, etc.) antes de eliminar
    // Esta validación se puede agregar cuando se implementen otros módulos

    await company.destroy();

    res.json({ message: 'Empresa eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/companies/:id/fiscal-config - Obtener configuración fiscal
router.get('/:id/fiscal-config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { FE_IssuerConfig } = require('../models');
    const config = await FE_IssuerConfig.findOne({ where: { companyId: req.params.id } });
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error getting fiscal config:', error);
    res.status(500).json({ message: 'Error interno' });
  }
});

// PUT /api/companies/:id/fiscal-config - Actualizar configuración fiscal
router.put('/:id/fiscal-config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { FE_IssuerConfig } = require('../models');
    const companyId = req.params.id;
    const {
      ruc, dv, razonSocial, direccion, sucursal, puntoDeVenta,
      pacProvider, environment, pacUser, pacPassword, resolutionNumber, apiKey
    } = req.body;

    let config = await FE_IssuerConfig.findOne({ where: { companyId } });

    const data = {
      companyId,
      ruc, dv, razonSocial, direccion, sucursal, puntoDeVenta,
      pacProvider, environment,
      authData: {
        user: pacUser,
        password: pacPassword,
        apiKey: apiKey, // Added apiKey
        resolutionNumber
      }
    };

    if (config) {
      await config.update(data);
    } else {
      config = await FE_IssuerConfig.create(data);
    }

    res.json({ success: true, config });
  } catch (error) {
    console.error('Error updating fiscal config:', error);
    res.status(500).json({ message: 'Error interno: ' + error.message });
  }
});

module.exports = router;