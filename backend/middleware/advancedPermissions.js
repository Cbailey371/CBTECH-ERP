const { UserCompany } = require('../models');

/**
 * Sistema avanzado de permisos granulares
 * Permite validar permisos específicos por módulo, función y contexto
 */

// Definición de módulos y sus permisos
const MODULE_PERMISSIONS = {
  // Módulo de Clientes
  customers: {
    name: 'Clientes',
    permissions: {
      'customers.view': { name: 'Ver clientes', description: 'Acceso a lista y detalles de clientes' },
      'customers.create': { name: 'Crear clientes', description: 'Crear nuevos clientes' },
      'customers.update': { name: 'Actualizar clientes', description: 'Modificar información de clientes' },
      'customers.delete': { name: 'Eliminar clientes', description: 'Eliminar clientes del sistema' },
      'customers.export': { name: 'Exportar clientes', description: 'Exportar datos de clientes' },
      'customers.import': { name: 'Importar clientes', description: 'Importar clientes masivamente' }
    }
  },

  // Módulo de Productos/Inventario
  products: {
    name: 'Productos',
    permissions: {
      'products.view': { name: 'Ver productos', description: 'Acceso a inventario y productos' },
      'products.create': { name: 'Crear productos', description: 'Agregar nuevos productos' },
      'products.update': { name: 'Actualizar productos', description: 'Modificar productos existentes' },
      'products.delete': { name: 'Eliminar productos', description: 'Eliminar productos del inventario' },
      'products.adjust': { name: 'Ajustar stock', description: 'Realizar ajustes de inventario' },
      'products.transfer': { name: 'Transferir productos', description: 'Transferir entre almacenes' }
    }
  },

  // Módulo de Ventas/Facturas
  sales: {
    name: 'Ventas',
    permissions: {
      'sales.view': { name: 'Ver ventas', description: 'Acceso a facturas y ventas' },
      'sales.create': { name: 'Crear ventas', description: 'Generar facturas y cotizaciones' },
      'sales.update': { name: 'Actualizar ventas', description: 'Modificar ventas pendientes' },
      'sales.cancel': { name: 'Cancelar ventas', description: 'Cancelar facturas y ventas' },
      'sales.discount': { name: 'Aplicar descuentos', description: 'Aplicar descuentos especiales' },
      'sales.refund': { name: 'Procesar devoluciones', description: 'Procesar reembolsos y devoluciones' }
    }
  },

  // Módulo de Compras
  purchases: {
    name: 'Compras',
    permissions: {
      'purchases.view': { name: 'Ver compras', description: 'Acceso a órdenes de compra' },
      'purchases.create': { name: 'Crear compras', description: 'Generar órdenes de compra' },
      'purchases.approve': { name: 'Aprobar compras', description: 'Aprobar órdenes de compra' },
      'purchases.receive': { name: 'Recibir mercancía', description: 'Registrar recepción de productos' },
      'purchases.return': { name: 'Devolver compras', description: 'Procesar devoluciones a proveedores' }
    }
  },

  // Módulo de Reportes
  reports: {
    name: 'Reportes',
    permissions: {
      'reports.sales': { name: 'Reportes de ventas', description: 'Acceso a reportes de ventas' },
      'reports.financial': { name: 'Reportes financieros', description: 'Acceso a reportes financieros' },
      'reports.inventory': { name: 'Reportes de inventario', description: 'Reportes de stock y movimientos' },
      'reports.customers': { name: 'Reportes de clientes', description: 'Análisis de clientes' },
      'reports.export': { name: 'Exportar reportes', description: 'Exportar reportes a Excel/PDF' },
      'reports.schedule': { name: 'Programar reportes', description: 'Programar reportes automáticos' }
    }
  },

  // Módulo de Administración
  admin: {
    name: 'Administración',
    permissions: {
      'admin.users': { name: 'Gestión de usuarios', description: 'Administrar usuarios del sistema' },
      'admin.companies': { name: 'Gestión de empresas', description: 'Administrar información de empresas' },
      'admin.settings': { name: 'Configuración del sistema', description: 'Modificar configuraciones generales' },
      'admin.backup': { name: 'Respaldos', description: 'Realizar y restaurar respaldos' },
      'admin.audit': { name: 'Auditoría', description: 'Acceso a logs y auditoría del sistema' },
      'admin.integrations': { name: 'Integraciones', description: 'Configurar integraciones externas' }
    }
  }
};

// Roles predefinidos con sus permisos
const ROLE_PERMISSIONS = {
  viewer: [
    'customers.view',
    'products.view',
    'sales.view',
    'purchases.view',
    'reports.sales',
    'reports.inventory'
  ],
  
  user: [
    'customers.view', 'customers.create', 'customers.update',
    'products.view', 'products.create', 'products.update',
    'sales.view', 'sales.create', 'sales.update',
    'purchases.view', 'purchases.create',
    'reports.sales', 'reports.inventory', 'reports.customers'
  ],
  
  manager: [
    'customers.view', 'customers.create', 'customers.update', 'customers.delete', 'customers.export',
    'products.view', 'products.create', 'products.update', 'products.delete', 'products.adjust', 'products.transfer',
    'sales.view', 'sales.create', 'sales.update', 'sales.cancel', 'sales.discount', 'sales.refund',
    'purchases.view', 'purchases.create', 'purchases.approve', 'purchases.receive', 'purchases.return',
    'reports.sales', 'reports.financial', 'reports.inventory', 'reports.customers', 'reports.export',
    'admin.settings'
  ],
  
  admin: Object.keys(MODULE_PERMISSIONS).flatMap(module => 
    Object.keys(MODULE_PERMISSIONS[module].permissions)
  )
};

/**
 * Middleware avanzado de permisos
 * @param {string|Array} requiredPermissions - Permisos requeridos
 * @param {Object} options - Opciones adicionales
 */
const requireAdvancedPermissions = (requiredPermissions = [], options = {}) => {
  return async (req, res, next) => {
    try {
      // Verificar que existe contexto de empresa
      if (!req.companyContext) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere contexto de empresa',
          code: 'COMPANY_CONTEXT_REQUIRED'
        });
      }

      const { role, permissions: userPermissions } = req.companyContext;
      const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      
      // Verificar cada permiso requerido
      const missingPermissions = [];
      
      for (const permission of permissionsArray) {
        if (!hasPermission(role, userPermissions, permission, options)) {
          missingPermissions.push(permission);
        }
      }

      if (missingPermissions.length > 0) {
        return res.status(403).json({
          success: false,
          message: 'Permisos insuficientes para esta operación',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionsArray,
          missing: missingPermissions,
          userRole: role,
          availablePermissions: getUserAvailablePermissions(role, userPermissions)
        });
      }

      // Agregar información de permisos al request
      req.userPermissions = {
        role,
        permissions: userPermissions,
        hasPermission: (permission) => hasPermission(role, userPermissions, permission),
        getAllPermissions: () => getUserAvailablePermissions(role, userPermissions)
      };

      next();

    } catch (error) {
      console.error('Error en middleware de permisos avanzados:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        code: 'PERMISSIONS_CHECK_ERROR'
      });
    }
  };
};

/**
 * Verificar si un usuario tiene un permiso específico
 */
const hasPermission = (role, userPermissions, permission, options = {}) => {
  // Admin siempre tiene todos los permisos
  if (role === 'admin') {
    return true;
  }

  // Verificar permisos específicos del usuario
  if (userPermissions && userPermissions[permission] === true) {
    return true;
  }

  // Verificar permisos del rol
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  if (rolePermissions.includes(permission)) {
    return true;
  }

  // Verificar dependencias de permisos si se especifican
  if (options.allowDependencies) {
    const dependencies = getPermissionDependencies(permission);
    return dependencies.some(dep => hasPermission(role, userPermissions, dep));
  }

  return false;
};

/**
 * Obtener todos los permisos disponibles para un usuario
 */
const getUserAvailablePermissions = (role, userPermissions = {}) => {
  let permissions = [];

  // Permisos por rol
  if (ROLE_PERMISSIONS[role]) {
    permissions = [...ROLE_PERMISSIONS[role]];
  }

  // Permisos específicos del usuario
  Object.entries(userPermissions).forEach(([permission, granted]) => {
    if (granted && !permissions.includes(permission)) {
      permissions.push(permission);
    }
  });

  // Admin tiene todos los permisos
  if (role === 'admin') {
    permissions = Object.keys(MODULE_PERMISSIONS).flatMap(module => 
      Object.keys(MODULE_PERMISSIONS[module].permissions)
    );
  }

  return permissions;
};

/**
 * Obtener dependencias de un permiso
 */
const getPermissionDependencies = (permission) => {
  const dependencies = {
    'customers.update': ['customers.view'],
    'customers.delete': ['customers.view', 'customers.update'],
    'products.update': ['products.view'],
    'products.delete': ['products.view', 'products.update'],
    'sales.update': ['sales.view'],
    'sales.cancel': ['sales.view'],
    'purchases.approve': ['purchases.view'],
    'purchases.receive': ['purchases.view', 'purchases.approve']
  };

  return dependencies[permission] || [];
};

/**
 * Obtener información detallada de permisos
 */
const getPermissionInfo = (permission) => {
  for (const module of Object.values(MODULE_PERMISSIONS)) {
    if (module.permissions[permission]) {
      return {
        module: module.name,
        ...module.permissions[permission]
      };
    }
  }
  return null;
};

/**
 * Endpoint para obtener permisos disponibles
 */
const getAvailablePermissions = async (req, res) => {
  try {
    const { role, permissions: userPermissions } = req.companyContext || {};
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'No se puede determinar el rol del usuario'
      });
    }

    const availablePermissions = getUserAvailablePermissions(role, userPermissions);
    const permissionDetails = {};

    // Agregar detalles de cada permiso
    availablePermissions.forEach(permission => {
      const info = getPermissionInfo(permission);
      if (info) {
        permissionDetails[permission] = info;
      }
    });

    res.json({
      success: true,
      role,
      permissions: availablePermissions,
      permissionDetails,
      moduleStructure: MODULE_PERMISSIONS
    });

  } catch (error) {
    console.error('Error al obtener permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  MODULE_PERMISSIONS,
  ROLE_PERMISSIONS,
  requireAdvancedPermissions,
  hasPermission,
  getUserAvailablePermissions,
  getPermissionInfo,
  getAvailablePermissions
};