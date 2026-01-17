
const express = require('express');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { authenticateToken, authorize } = require('../middleware/auth');
const { generateCode } = require('../utils/codeGenerator');
const { User, Company, UserCompany } = require('../models');
const router = express.Router();

// Middleware para verificar rol de administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.'
    });
  }
  next();
};

// GET /api/users - Obtener todos los usuarios
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { is_active, search } = req.query;
    console.log('GET /users query:', req.query);

    const whereClause = {};

    if (is_active !== undefined) {
      whereClause.isActive = is_active === 'true';
    }

    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `% ${search}% ` } },
        { email: { [Op.iLike]: `% ${search}% ` } },
        { firstName: { [Op.iLike]: `% ${search}% ` } },
        { lastName: { [Op.iLike]: `% ${search}% ` } }
      ];
    }

    if (req.query.role) {
      whereClause.role = req.query.role;
    }
    console.log('GET /users whereClause:', whereClause);

    const users = await User.findAll({
      where: whereClause,
      include: [
        {
          model: Company,
          as: 'companies',
          through: {
            model: UserCompany,
            as: 'userCompany',
            where: { isActive: true },
            attributes: ['role', 'isDefault', 'assignedAt']
          },
          attributes: ['id', 'name', 'legalName', 'tradeName'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/users/:id - Obtener un usuario específico
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Company,
          as: 'companies',
          through: {
            model: UserCompany,
            as: 'userCompany',
            where: { isActive: true },
            attributes: ['role', 'isDefault', 'permissions', 'assignedAt', 'notes']
          },
          attributes: ['id', 'name', 'legalName', 'tradeName', 'taxId', 'email', 'city', 'country'],
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/users - Crear nuevo usuario
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, code } = req.body;

    // Validar datos requeridos
    if (!username || !email || !password) {
      console.log('❌ Intento de crear usuario fallido: Faltan campos requeridos', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Username, email y password son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      console.log(`❌ Intento de crear usuario fallido: Duplicado. Username: ${username}, Email: ${email}`);
      return res.status(400).json({
        success: false,
        message: `El usuario o email ya está en uso por otro usuario (ID: ${existingUser.id})`
      });
    }

    // Crear nuevo usuario
    let userCode = code;
    if (!userCode) {
      userCode = await generateCode(User, 'USR', {}, 3); // Global scope
    }

    const newUser = await User.create({
      code: userCode,
      username,
      email,
      password, // Model likely handles hashing via hooks
      firstName: firstName || username,
      lastName: lastName || '',
      role: role || 'user',
      isActive: true
    });

    // Asignar rol en la tabla de asociación (UserRoles)
    // Importar Role dinámicamente para evitar problemas de inicialización
    const { Role } = require('../models');
    if (Role) {
      const roleName = mapRoleName(role || 'user');
      const roleRecord = await Role.findOne({ where: { name: roleName } });

      if (roleRecord) {
        await newUser.addRole(roleRecord);
        console.log(`Rol '${roleName}' asignado al usuario ${newUser.username} `);
      } else {
        console.warn(`Rol '${roleName}' no encontrado en la base de datos.`);
      }
    } else {
      console.error('Modelo Role no disponible');
    }

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', authenticateToken, async (req, res) => {
  const fs = require('fs');
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, role, isActive } = req.body;

    const { Role } = require('../models');

    // Verificar si el usuario requiriente tiene privilegios de administrador
    let isAdmin = req.user.role === 'admin';

    // Si no es admin por token, verificar roles en BD (para soporte de sistema dual)
    if (!isAdmin && Role) {
      try {
        const requester = await User.findByPk(req.user.id, {
          include: [{
            model: Role,
            as: 'roles',
            required: false
          }]
        });

        if (requester && requester.roles && requester.roles.length > 0) {
          // Check if any role is admin or super_admin
          const hasAdminRole = requester.roles.some(r => ['admin', 'super_admin'].includes(r.name));
          if (hasAdminRole) {
            isAdmin = true;
          }
        }
      } catch (roleCheckError) {
        console.error('Error checking DB roles:', roleCheckError);
        // Don't crash, just proceed with isAdmin = false
      }
    }

    // Verificar permisos: solo admin puede actualizar otros usuarios
    if (!isAdmin && req.user.id !== parseInt(id)) {
      console.log('❌ Acceso denegado update user:', req.user.role, req.user.id, id);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar este usuario'
      });
    }

    console.log(`🔧 PUT / users / ${id} - IsAdmin: ${isAdmin}, Body: `, JSON.stringify(req.body, null, 2));

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar campos
    const updateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    // Solo admin puede cambiar rol y estado
    if (isAdmin) {
      if (role !== undefined) {
        updateData.role = role;

        // Actualizar asociación de rol
        if (Role) {
          const roleName = mapRoleName(role);
          const roleRecord = await Role.findOne({ where: { name: roleName } });

          if (roleRecord) {
            await user.setRoles([roleRecord]);
            console.log(`Rol '${roleName}' actualizado para usuario ${user.username} `);
          }
        }
      }
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    // Actualizar password si se proporciona (admin o propio usuario)
    const { password } = req.body;
    if (password) {
      updateData.password = password; // El hook beforeUpdate del modelo User debería hashear esto
    }

    await user.update(updateData);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: user
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    fs.appendFileSync('backend/debug_error.log', `[${new Date().toISOString()}] Error PUT / users / ${req.params.id}: ${error.stack} \n`);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/users/:id/password - Cambiar contraseña
router.put('/:id/password', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Verificar permisos: solo el mismo usuario o admin
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar la contraseña de este usuario'
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nueva contraseña es requerida'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Si no es admin, verificar contraseña actual
    if (req.user.role !== 'admin') {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual es requerida'
        });
      }

      const isValidPassword = await user.validatePassword(currentPassword);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }
    }

    // Actualizar contraseña
    await user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // No permitir que el admin se elimine a sí mismo
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Helper para mapear roles
function mapRoleName(role) {
  const mapping = {
    'admin': 'admin',
    'super_admin': 'super_admin',
    'user': 'user',
    'manager': 'manager'
  };
  return mapping[role] || 'user';
}

module.exports = router;