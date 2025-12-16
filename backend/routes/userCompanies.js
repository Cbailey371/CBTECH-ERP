const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { User, Company, UserCompany, sequelize } = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar permisos de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
  }
  next();
};

// GET /api/user-companies/my-companies - Obtener empresas del usuario logueado
router.get('/my-companies', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Obteniendo empresas para usuario ID:', userId);

    // Usar consulta SQL directa para evitar problemas con Sequelize
    const userCompanies = await sequelize.query(`
      SELECT 
        uc.id,
        uc.user_id,
        uc.company_id,
        uc.role,
        uc.permissions,
        uc.is_active,
        uc.is_default,
        uc.assigned_by,
        uc.assigned_at,
        uc.notes,
        uc.created_at,
        uc.updated_at,
        c.id as "company.id",
        c.name as "company.name",
        c.legal_name as "company.legal_name",
        c.trade_name as "company.trade_name",
        c.tax_id as "company.tax_id",
        c.email as "company.email",
        c.phone as "company.phone",
        c.website as "company.website",
        c.city as "company.city",
        c.country as "company.country",
        c.industry as "company.industry"
      FROM user_companies uc
      JOIN companies c ON uc.company_id = c.id
      WHERE uc.user_id = :userId AND uc.is_active = true
      ORDER BY uc.is_default DESC, uc.created_at ASC
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    // Transformar los datos para que tengan la estructura esperada
    const transformedData = userCompanies.map(row => ({
      id: row.id,
      user_id: row.user_id,
      company_id: row.company_id,
      role: row.role,
      permissions: row.permissions,
      is_active: row.is_active,
      is_default: row.is_default,
      assigned_by: row.assigned_by,
      assigned_at: row.assigned_at,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      company: {
        id: row['company.id'],
        name: row['company.name'],
        legal_name: row['company.legal_name'],
        trade_name: row['company.trade_name'],
        tax_id: row['company.tax_id'],
        email: row['company.email'],
        phone: row['company.phone'],
        website: row['company.website'],
        city: row['company.city'],
        country: row['company.country'],
        industry: row['company.industry']
      }
    }));

    console.log('Empresas encontradas:', transformedData.length);
    console.log('Datos transformados:', JSON.stringify(transformedData, null, 2));

    return res.json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Error al obtener mis empresas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/user-companies/user/:userId - Obtener empresas de un usuario
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar permisos: solo admin o el mismo usuario puede ver sus empresas
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'No tienes permiso para ver las empresas de este usuario' });
    }

    const userCompanies = await UserCompany.findAll({
      where: {
        userId,
        isActive: true
      },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'legalName', 'tradeName', 'taxId', 'email', 'city', 'country', 'isActive']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['isDefault', 'DESC'], ['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        userCompanies
      }
    });

  } catch (error) {
    console.error('Error al obtener empresas del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /api/user-companies/company/:companyId - Obtener usuarios de una empresa
router.get('/company/:companyId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { companyId } = req.params;

    // Verificar que la empresa existe
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    const companyUsers = await UserCompany.findAll({
      where: {
        companyId,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'isActive']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ],
      order: [['role', 'ASC'], ['created_at', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        companyUsers
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios de la empresa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/user-companies - Asignar usuario a empresa
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  console.log('🚀 POST /user-companies INICIADO');
  try {
    const {
      userId,
      companyId,
      role = 'user',
      permissions = {},
      isDefault = false,
      notes
    } = req.body;

    console.log('📝 POST /user-companies llamado con:', {
      userId, companyId, role, isDefault, notes
    });

    // Validar campos requeridos
    if (!userId || !companyId) {
      return res.status(400).json({
        message: 'userId y companyId son requeridos'
      });
    }

    // Verificar que el usuario y la empresa existen
    const [user, company] = await Promise.all([
      User.findByPk(userId),
      Company.findByPk(companyId)
    ]);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (!company) {
      return res.status(404).json({ message: 'Empresa no encontrada' });
    }

    // Verificar si ya existe la relación
    const existingRelation = await UserCompany.findOne({
      where: { userId, companyId }
    });

    console.log('Buscando relación existente para userId:', userId, 'companyId:', companyId);
    console.log('Relación encontrada:', existingRelation ? {
      id: existingRelation.id,
      isActive: existingRelation.isActive,
      role: existingRelation.role
    } : 'ninguna');

    if (existingRelation) {
      console.log('Relación encontrada:', {
        id: existingRelation.id,
        isActive: existingRelation.isActive,
        role: existingRelation.role
      });

      if (existingRelation.isActive) {
        console.log('Relación está activa, actualizando si es necesario (Upsert)...');

        // Update fields if provided
        await existingRelation.update({
          role,
          permissions,
          isDefault,
          assignedBy: req.user.id,
          notes
        });

        // Get full details to match response format
        const fullExistingRelation = await UserCompany.findByPk(existingRelation.id, {
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'firstName', 'lastName']
            },
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'legalName', 'tradeName']
            },
            {
              model: User,
              as: 'assignedByUser',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        });

        return res.status(200).json({
          success: true,
          data: {
            userCompany: fullExistingRelation
          },
          message: 'Datos de acceso actualizados exitosamente'
        });
      } else {
        console.log('Relación está inactiva, reactivando...');
        // Si existe pero está inactiva, reactivarla
        await existingRelation.update({
          role,
          permissions,
          isDefault,
          isActive: true,
          assignedBy: req.user.id,
          assignedAt: new Date(),
          notes
        });

        // Obtener la relación actualizada con includes
        const updatedUserCompany = await UserCompany.findByPk(existingRelation.id, {
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email', 'firstName', 'lastName']
            },
            {
              model: Company,
              as: 'company',
              attributes: ['id', 'name', 'legalName', 'tradeName']
            },
            {
              model: User,
              as: 'assignedByUser',
              attributes: ['id', 'username', 'firstName', 'lastName']
            }
          ]
        });

        return res.status(200).json({
          success: true,
          data: {
            userCompany: updatedUserCompany
          },
          message: 'Relación reactivada exitosamente'
        });
      }
    }

    // Crear la relación
    const userCompany = await UserCompany.create({
      userId,
      companyId,
      role,
      permissions,
      isDefault,
      assignedBy: req.user.id,
      assignedAt: new Date(),
      notes
    });

    // Obtener la relación con datos completos
    const fullUserCompany = await UserCompany.findByPk(userCompany.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'legalName', 'tradeName']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        userCompany: fullUserCompany
      }
    });

  } catch (error) {
    console.error('Error al asignar usuario a empresa:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /api/user-companies/:id - Actualizar relación usuario-empresa
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role,
      permissions,
      isDefault,
      isActive,
      notes
    } = req.body;

    const userCompany = await UserCompany.findByPk(id);

    if (!userCompany) {
      return res.status(404).json({ message: 'Relación usuario-empresa no encontrada' });
    }

    // Actualizar campos
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (notes !== undefined) updateData.notes = notes;

    await userCompany.update(updateData);

    // Obtener la relación actualizada con datos completos
    const updatedUserCompany = await UserCompany.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'firstName', 'lastName']
        },
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'legalName', 'tradeName']
        },
        {
          model: User,
          as: 'assignedByUser',
          attributes: ['id', 'username', 'firstName', 'lastName']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        userCompany: updatedUserCompany
      }
    });

  } catch (error) {
    console.error('Error al actualizar relación usuario-empresa:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Error de validación',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }

    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /api/user-companies/:id - Eliminar acceso de usuario a empresa
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userCompany = await UserCompany.findByPk(id, {
      include: [
        { model: User, as: 'user' },
        { model: Company, as: 'company' }
      ]
    });

    if (!userCompany) {
      return res.status(404).json({ message: 'Relación usuario-empresa no encontrada' });
    }

    // No permitir eliminar si es la empresa por defecto y es la única empresa del usuario
    if (userCompany.isDefault) {
      const userCompaniesCount = await UserCompany.count({
        where: {
          userId: userCompany.userId,
          isActive: true
        }
      });

      if (userCompaniesCount <= 1) {
        return res.status(400).json({
          message: 'No se puede eliminar el acceso a la única empresa del usuario'
        });
      }
    }

    await userCompany.destroy();

    res.json({
      success: true,
      data: {
        deletedRelation: {
          userId: userCompany.userId,
          companyId: userCompany.companyId,
          userName: userCompany.user.username,
          companyName: userCompany.company.name
        }
      }
    });

  } catch (error) {
    console.error('Error al eliminar relación usuario-empresa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /api/user-companies/set-default - Establecer empresa por defecto
router.post('/set-default', authenticateToken, async (req, res) => {
  try {
    const { userId, companyId } = req.body;

    // Verificar permisos: solo admin o el mismo usuario puede cambiar su empresa por defecto
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ message: 'No tienes permiso para cambiar la empresa por defecto de este usuario' });
    }

    // Verificar que la relación existe
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId, isActive: true }
    });

    if (!userCompany) {
      return res.status(404).json({ message: 'El usuario no tiene acceso a esta empresa' });
    }

    // Establecer como empresa por defecto
    await UserCompany.setDefaultCompany(userId, companyId);

    res.json({
      success: true,
      message: 'Empresa por defecto establecida exitosamente'
    });

  } catch (error) {
    console.error('Error al establecer empresa por defecto:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DEBUG: Endpoint temporal para ver registro específico
router.get('/debug/:userId/:companyId', authenticateToken, async (req, res) => {
  try {
    const { userId, companyId } = req.params;

    const record = await UserCompany.findOne({
      where: { userId, companyId }
    });

    res.json({
      found: !!record,
      record: record || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;