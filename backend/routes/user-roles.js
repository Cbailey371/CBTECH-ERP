const express = require('express');
const { Op } = require('sequelize');
const { User, Role, Permission, UserRole } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener roles de un usuario específico
router.get('/:userId/roles', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        through: {
          attributes: ['created_at']
        },
        include: [{
          model: Permission,
          as: 'permissions',
          through: {
            attributes: []
          }
        }]
      }],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active
      },
      roles: user.roles,
      effective_permissions: user.roles.reduce((permissions, role) => {
        role.permissions.forEach(permission => {
          if (!permissions.find(p => p.id === permission.id)) {
            permissions.push(permission);
          }
        });
        return permissions;
      }, [])
    });
  } catch (error) {
    console.error('Error al obtener roles del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Asignar roles a un usuario
router.post('/:userId/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role_ids } = req.body;

    if (!role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de roles' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que todos los roles existen y están activos
    const roles = await Role.findAll({
      where: { 
        id: role_ids,
        is_active: true
      }
    });

    if (roles.length !== role_ids.length) {
      return res.status(400).json({ message: 'Algunos roles no existen o no están activos' });
    }

    // Asignar roles al usuario (esto reemplaza todos los roles existentes)
    await user.setRoles(roles);

    // Obtener el usuario con sus nuevos roles
    const updatedUser = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        through: {
          attributes: ['created_at']
        },
        include: [{
          model: Permission,
          as: 'permissions',
          through: {
            attributes: []
          }
        }]
      }],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
    });

    res.json({
      message: 'Roles asignados correctamente',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        is_active: updatedUser.is_active
      },
      roles: updatedUser.roles
    });
  } catch (error) {
    console.error('Error al asignar roles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Agregar roles adicionales a un usuario (sin reemplazar los existentes)
router.put('/:userId/roles/add', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role_ids } = req.body;

    if (!role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de roles' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que todos los roles existen y están activos
    const roles = await Role.findAll({
      where: { 
        id: role_ids,
        is_active: true
      }
    });

    if (roles.length !== role_ids.length) {
      return res.status(400).json({ message: 'Algunos roles no existen o no están activos' });
    }

    // Agregar roles al usuario (sin reemplazar los existentes)
    await user.addRoles(roles);

    // Obtener el usuario con sus roles actualizados
    const updatedUser = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        through: {
          attributes: ['created_at']
        }
      }],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
    });

    res.json({
      message: 'Roles agregados correctamente',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        is_active: updatedUser.is_active
      },
      roles: updatedUser.roles
    });
  } catch (error) {
    console.error('Error al agregar roles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Remover roles específicos de un usuario
router.delete('/:userId/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role_ids } = req.body;

    if (!role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de roles' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que los roles existen
    const roles = await Role.findAll({
      where: { id: role_ids }
    });

    // Remover roles del usuario
    await user.removeRoles(roles);

    // Obtener el usuario con sus roles actualizados
    const updatedUser = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'roles',
        through: {
          attributes: ['created_at']
        }
      }],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
    });

    res.json({
      message: 'Roles removidos correctamente',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        is_active: updatedUser.is_active
      },
      roles: updatedUser.roles
    });
  } catch (error) {
    console.error('Error al remover roles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener todos los usuarios con sus roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role_id = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    const includeOptions = [{
      model: Role,
      as: 'roles',
      through: {
        attributes: ['created_at']
      },
      attributes: ['id', 'name', 'display_name', 'is_active']
    }];

    // Filtro de búsqueda por texto
    if (search) {
      whereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Filtro por rol específico
    if (role_id) {
      includeOptions[0].where = { id: role_id };
      includeOptions[0].required = true; // INNER JOIN para solo usuarios con ese rol
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'created_at'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true // Para contar correctamente con las relaciones
    });

    res.json({
      users: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios con roles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener usuarios que tienen un rol específico
router.get('/by-role/:roleId', authenticateToken, async (req, res) => {
  try {
    const { roleId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    const { count, rows } = await User.findAndCountAll({
      include: [{
        model: Role,
        as: 'roles',
        where: { id: roleId },
        through: {
          attributes: ['created_at']
        },
        attributes: ['id', 'name', 'display_name']
      }],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'created_at'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      distinct: true
    });

    res.json({
      role: {
        id: role.id,
        name: role.name,
        display_name: role.display_name
      },
      users: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios por rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
