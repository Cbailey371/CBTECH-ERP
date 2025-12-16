const express = require('express');
const { Op } = require('sequelize');
const { Permission, Role } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Obtener todos los permisos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      module = '', 
      action = '',
      include_roles = false 
    } = req.query;
    
    const offset = (page - 1) * limit;

    // Construir filtros
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { display_name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (module) {
      whereClause.module = module;
    }

    if (action) {
      whereClause.action = action;
    }

    const includeOptions = [];
    if (include_roles === 'true') {
      includeOptions.push({
        model: Role,
        as: 'roles',
        through: {
          attributes: []
        },
        attributes: ['id', 'name', 'display_name']
      });
    }

    const { count, rows } = await Permission.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['module', 'ASC'], ['action', 'ASC'], ['name', 'ASC']]
    });

    // Obtener módulos únicos para filtros
    const modules = await Permission.findAll({
      attributes: ['module'],
      group: ['module'],
      order: [['module', 'ASC']]
    });

    // Obtener acciones únicas para filtros
    const actions = await Permission.findAll({
      attributes: ['action'],
      group: ['action'],
      order: [['action', 'ASC']]
    });

    res.json({
      permissions: rows,
      filters: {
        modules: modules.map(m => m.module),
        actions: actions.map(a => a.action)
      },
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener un permiso por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { include_roles = false } = req.query;

    const includeOptions = [];
    if (include_roles === 'true') {
      includeOptions.push({
        model: Role,
        as: 'roles',
        through: {
          attributes: []
        },
        attributes: ['id', 'name', 'display_name', 'description']
      });
    }

    const permission = await Permission.findByPk(id, {
      include: includeOptions
    });

    if (!permission) {
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }

    res.json(permission);
  } catch (error) {
    console.error('Error al obtener permiso:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Crear un nuevo permiso
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      display_name, 
      description, 
      module, 
      action,
      is_system = false 
    } = req.body;

    // Validar campos requeridos
    if (!name || !display_name || !module || !action) {
      return res.status(400).json({ 
        message: 'Nombre, nombre para mostrar, módulo y acción son requeridos' 
      });
    }

    // Verificar que el nombre del permiso no exista
    const existingPermission = await Permission.findOne({ where: { name } });
    if (existingPermission) {
      return res.status(400).json({ message: 'Ya existe un permiso con ese nombre' });
    }

    // Crear el permiso
    const permission = await Permission.create({
      name,
      display_name,
      description,
      module,
      action,
      is_system
    });

    res.status(201).json(permission);
  } catch (error) {
    console.error('Error al crear permiso:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Actualizar un permiso
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, display_name, description, module, action } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }

    // No permitir editar permisos del sistema (nombre y estructura)
    if (permission.is_system && (name !== permission.name || module !== permission.module || action !== permission.action)) {
      return res.status(400).json({ 
        message: 'No se puede cambiar la estructura de permisos del sistema' 
      });
    }

    // Si se cambió el nombre, verificar que no exista otro permiso con ese nombre
    if (name && name !== permission.name) {
      const existingPermission = await Permission.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: id }
        } 
      });
      if (existingPermission) {
        return res.status(400).json({ message: 'Ya existe un permiso con ese nombre' });
      }
    }

    // Actualizar campos
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (display_name !== undefined) updateData.display_name = display_name;
    if (description !== undefined) updateData.description = description;
    if (module !== undefined) updateData.module = module;
    if (action !== undefined) updateData.action = action;

    await permission.update(updateData);

    res.json(permission);
  } catch (error) {
    console.error('Error al actualizar permiso:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Eliminar un permiso
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({ message: 'Permiso no encontrado' });
    }

    // No permitir eliminar permisos del sistema
    if (permission.is_system) {
      return res.status(400).json({ message: 'No se pueden eliminar permisos del sistema' });
    }

    // Verificar si hay roles que usan este permiso
    const rolesCount = await permission.countRoles();
    if (rolesCount > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar el permiso porque está asignado a ${rolesCount} rol(es)` 
      });
    }

    // Eliminar el permiso
    await permission.destroy();

    res.json({ message: 'Permiso eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar permiso:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener permisos agrupados por módulo
router.get('/grouped/by-module', authenticateToken, async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['module', 'ASC'], ['action', 'ASC'], ['name', 'ASC']]
    });

    // Agrupar permisos por módulo
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const module = permission.module;
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(permission);
      return acc;
    }, {});

    res.json(groupedPermissions);
  } catch (error) {
    console.error('Error al obtener permisos agrupados:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de permisos
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    // Total de permisos
    const totalPermissions = await Permission.count();

    // Permisos por módulo
    const permissionsByModule = await Permission.findAll({
      attributes: [
        'module',
        [Permission.sequelize.fn('COUNT', Permission.sequelize.col('id')), 'count']
      ],
      group: ['module'],
      order: [['module', 'ASC']]
    });

    // Permisos por acción
    const permissionsByAction = await Permission.findAll({
      attributes: [
        'action',
        [Permission.sequelize.fn('COUNT', Permission.sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [['action', 'ASC']]
    });

    // Permisos del sistema vs. personalizados
    const systemPermissions = await Permission.count({ where: { is_system: true } });
    const customPermissions = await Permission.count({ where: { is_system: false } });

    res.json({
      total_permissions: totalPermissions,
      system_permissions: systemPermissions,
      custom_permissions: customPermissions,
      by_module: permissionsByModule.map(p => ({
        module: p.module,
        count: parseInt(p.dataValues.count)
      })),
      by_action: permissionsByAction.map(p => ({
        action: p.action,
        count: parseInt(p.dataValues.count)
      }))
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de permisos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
