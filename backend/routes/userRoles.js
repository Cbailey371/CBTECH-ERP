const express = require('express');
const { Op } = require('sequelize');
const { User, Role, Permission, UserRole } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Asignar rol a un usuario
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({ message: 'ID de usuario y rol son requeridos' });
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el rol existe
    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Verificar que el rol esté activo
    if (!role.is_active) {
      return res.status(400).json({ message: 'No se puede asignar un rol inactivo' });
    }

    // Verificar que la asignación no exista ya
    const existingAssignment = await UserRole.findOne({
      where: { user_id, role_id }
    });

    if (existingAssignment) {
      return res.status(400).json({ message: 'El usuario ya tiene asignado este rol' });
    }

    // Crear la asignación
    const userRole = await UserRole.create({
      user_id,
      role_id
    });

    // Obtener el usuario con sus roles actualizados
    const updatedUser = await User.findByPk(user_id, {
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

    res.status(201).json({
      message: 'Rol asignado correctamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al asignar rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Remover rol de un usuario
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { user_id, role_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({ message: 'ID de usuario y rol son requeridos' });
    }

    // Verificar que la asignación existe
    const userRole = await UserRole.findOne({
      where: { user_id, role_id }
    });

    if (!userRole) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }

    // Eliminar la asignación
    await userRole.destroy();

    // Obtener el usuario con sus roles actualizados
    const updatedUser = await User.findByPk(user_id, {
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
      message: 'Rol removido correctamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al remover rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener todos los usuarios con sus roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role_id = '' } = req.query;
    const offset = (page - 1) * limit;

    // Construir filtros para usuarios
    const userWhereClause = {};
    if (search) {
      userWhereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Incluir roles
    const includeOptions = [{
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
    }];

    // Si se especifica un rol, filtrar usuarios que tengan ese rol
    if (role_id) {
      includeOptions[0].where = { id: role_id };
      includeOptions[0].required = true;
    }

    const { count, rows } = await User.findAndCountAll({
      where: userWhereClause,
      include: includeOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'created_at'],
      distinct: true
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

// Obtener roles de un usuario específico
router.get('/user/:user_id', authenticateToken, async (req, res) => {
  try {
    const { user_id } = req.params;

    const user = await User.findByPk(user_id, {
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

    // Obtener permisos únicos del usuario (de todos sus roles)
    const allPermissions = [];
    user.roles.forEach(role => {
      role.permissions.forEach(permission => {
        if (!allPermissions.find(p => p.id === permission.id)) {
          allPermissions.push(permission);
        }
      });
    });

    res.json({
      user: {
        ...user.toJSON(),
        all_permissions: allPermissions
      }
    });
  } catch (error) {
    console.error('Error al obtener roles del usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener usuarios de un rol específico
router.get('/role/:role_id', authenticateToken, async (req, res) => {
  try {
    const { role_id } = req.params;
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Verificar que el rol existe
    const role = await Role.findByPk(role_id);
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Construir filtros para usuarios
    const userWhereClause = {};
    if (search) {
      userWhereClause[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: userWhereClause,
      include: [{
        model: Role,
        as: 'roles',
        where: { id: role_id },
        through: {
          attributes: ['created_at']
        },
        required: true
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'created_at'],
      distinct: true
    });

    res.json({
      role: {
        id: role.id,
        name: role.name,
        display_name: role.display_name,
        description: role.description
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
    console.error('Error al obtener usuarios del rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Asignar múltiples roles a un usuario
router.post('/bulk-assign', authenticateToken, async (req, res) => {
  try {
    const { user_id, role_ids } = req.body;

    if (!user_id || !role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ message: 'ID de usuario y array de IDs de roles son requeridos' });
    }

    // Verificar que el usuario existe
    const user = await User.findByPk(user_id);
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
      return res.status(400).json({ message: 'Algunos roles no existen o están inactivos' });
    }

    // Obtener asignaciones existentes
    const existingAssignments = await UserRole.findAll({
      where: { user_id, role_id: role_ids }
    });

    // Filtrar roles que no están asignados ya
    const existingRoleIds = existingAssignments.map(ua => ua.role_id);
    const newRoleIds = role_ids.filter(id => !existingRoleIds.includes(id));

    // Crear nuevas asignaciones
    const newAssignments = newRoleIds.map(role_id => ({
      user_id,
      role_id
    }));

    if (newAssignments.length > 0) {
      await UserRole.bulkCreate(newAssignments);
    }

    // Obtener el usuario con sus roles actualizados
    const updatedUser = await User.findByPk(user_id, {
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
      message: `${newAssignments.length} roles asignados correctamente`,
      existing_assignments: existingRoleIds.length,
      new_assignments: newAssignments.length,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al asignar roles en lote:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Remover múltiples roles de un usuario
router.delete('/bulk-remove', authenticateToken, async (req, res) => {
  try {
    const { user_id, role_ids } = req.body;

    if (!user_id || !role_ids || !Array.isArray(role_ids)) {
      return res.status(400).json({ message: 'ID de usuario y array de IDs de roles son requeridos' });
    }

    // Eliminar las asignaciones
    const deletedCount = await UserRole.destroy({
      where: { 
        user_id,
        role_id: role_ids 
      }
    });

    // Obtener el usuario con sus roles actualizados
    const updatedUser = await User.findByPk(user_id, {
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
      message: `${deletedCount} roles removidos correctamente`,
      removed_count: deletedCount,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al remover roles en lote:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;