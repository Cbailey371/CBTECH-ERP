const express = require('express');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Role, Permission, RolePermission, User, UserRole } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', include_permissions = false } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { display_name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    const includeOptions = [];
    if (include_permissions === 'true') {
      includeOptions.push({
        model: Permission,
        as: 'permissions',
        through: {
          attributes: []
        }
      });
    }

    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      roles: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener un rol por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { include_permissions = false, include_users = false } = req.query;

    const includeOptions = [];
    
    if (include_permissions === 'true') {
      includeOptions.push({
        model: Permission,
        as: 'permissions',
        through: {
          attributes: []
        }
      });
    }

    if (include_users === 'true') {
      includeOptions.push({
        model: User,
        as: 'users',
        through: {
          attributes: []
        },
        attributes: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
      });
    }

    const role = await Role.findByPk(id, {
      include: includeOptions
    });

    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear un nuevo rol
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, display_name, description, is_active = true, permission_ids = [] } = req.body;

    // Validar campos requeridos
    if (!name || !display_name) {
      return res.status(400).json({ message: 'Nombre y nombre para mostrar son requeridos' });
    }

    // Verificar que el nombre del rol no exista
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ message: 'Ya existe un rol con ese nombre' });
    }

    // Crear el rol
    const role = await Role.create({
      name,
      displayName: display_name,
      description,
      isActive: is_active,
      isSystem: false
    });

    // Asignar permisos si se proporcionaron
    if (permission_ids && permission_ids.length > 0) {
      const permissions = await Permission.findAll({
        where: { id: permission_ids }
      });

      if (permissions.length !== permission_ids.length) {
        return res.status(400).json({ message: 'Algunos permisos no existen' });
      }

      await role.setPermissions(permissions);
    }

    // Obtener el rol completo con permisos
    const roleWithPermissions = await Role.findByPk(role.id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: {
          attributes: []
        }
      }]
    });

    res.status(201).json(roleWithPermissions);
  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar un rol
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_name, description, is_active, permission_ids } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // No permitir editar roles del sistema
    if (role.is_system && (name !== role.name)) {
      return res.status(400).json({ message: 'No se puede cambiar el nombre de roles del sistema' });
    }

    // Si se cambió el nombre, verificar que no exista otro rol con ese nombre
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: id }
        } 
      });
      if (existingRole) {
        return res.status(400).json({ message: 'Ya existe un rol con ese nombre' });
      }
    }

    // Actualizar campos
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (display_name !== undefined) updateData.displayName = display_name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.isActive = is_active;

    await role.update(updateData);

    // Actualizar permisos si se proporcionaron
    if (permission_ids !== undefined) {
      if (permission_ids.length > 0) {
        const permissions = await Permission.findAll({
          where: { id: permission_ids }
        });

        if (permissions.length !== permission_ids.length) {
          return res.status(400).json({ message: 'Algunos permisos no existen' });
        }

        await role.setPermissions(permissions);
      } else {
        // Remover todos los permisos
        await role.setPermissions([]);
      }
    }

    // Obtener el rol actualizado con permisos
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: {
          attributes: []
        }
      }]
    });

    res.json(updatedRole);
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar un rol
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // No permitir eliminar roles del sistema
    if (role.is_system) {
      return res.status(400).json({ message: 'No se pueden eliminar roles del sistema' });
    }

    // Verificar si hay usuarios asignados a este rol
    const userCount = await UserRole.count({ where: { role_id: id } });
    if (userCount > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar el rol porque tiene ${userCount} usuario(s) asignado(s)` 
      });
    }

    // Eliminar relaciones con permisos
    await RolePermission.destroy({ where: { role_id: id } });

    // Eliminar el rol
    await role.destroy();

    res.json({ message: 'Rol eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Asignar permisos a un rol
router.post('/:id/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    if (!permission_ids || !Array.isArray(permission_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de permisos' });
    }

    const permissions = await Permission.findAll({
      where: { id: permission_ids }
    });

    if (permissions.length !== permission_ids.length) {
      return res.status(400).json({ message: 'Algunos permisos no existen' });
    }

    await role.addPermissions(permissions);

    // Obtener permisos actualizados del rol
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: {
          attributes: []
        }
      }]
    });

    res.json(updatedRole);
  } catch (error) {
    console.error('Error al asignar permisos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Remover permisos de un rol
router.delete('/:id/permissions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    if (!permission_ids || !Array.isArray(permission_ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs de permisos' });
    }

    const permissions = await Permission.findAll({
      where: { id: permission_ids }
    });

    await role.removePermissions(permissions);

    // Obtener permisos actualizados del rol
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        as: 'permissions',
        through: {
          attributes: []
        }
      }]
    });

    res.json(updatedRole);
  } catch (error) {
    console.error('Error al remover permisos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
