const { UserCompany } = require('../models');

/**
 * Middleware para establecer el contexto de empresa en las requests
 * Valida que el usuario tenga acceso a la empresa especificada
 * y añade la información de la empresa al objeto request
 */
const companyContext = async (req, res, next) => {
  try {
    // Solo aplicar a usuarios autenticados
    if (!req.user || !req.user.id) {
      return next();
    }

    // Obtener company_id del query param o header
    const companyId = req.query.companyId || req.query.company_id || req.headers['x-company-id'];

    if (!companyId || isNaN(parseInt(companyId))) {
      // Si no se especifica empresa válida, continuar sin contexto 
      // Las rutas que lo requieran fallarán en requireCompanyContext
      req.companyContext = null;
      return next();
    }

    const requestedId = parseInt(companyId);

    // [VULN-001 Mitigation] Validar SIEMPRE contra la base de datos la relación User-Company
    const userCompany = await UserCompany.findOne({
      where: {
        userId: req.user.id,
        companyId: requestedId,
        isActive: true
      },
      include: [
        {
          model: require('../models').Company,
          as: 'company',
          attributes: ['id', 'name', 'legalName', 'isActive']
        }
      ]
    });

    if (!userCompany) {
      // Intento de acceso a empresa no autorizada o ID falso
      console.warn(`🚨 ACCESO DENEGADO: Usuario ${req.user.id} intentó acceder a Empresa ${requestedId} sin permisos.`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta empresa o la empresa no existe dentro de tu cuenta.',
        code: 'COMPANY_ACCESS_DENIED'
      });
    }

    if (!userCompany.company || !userCompany.company.isActive) {
      return res.status(403).json({
        success: false,
        message: 'La empresa está inactiva o no es válida.',
        code: 'COMPANY_INACTIVE'
      });
    }

    // Establecer el contexto de empresa verificado y seguro
    req.companyContext = {
      companyId: requestedId,
      userCompany: userCompany,
      company: userCompany.company,
      role: userCompany.role,
      permissions: userCompany.permissions || {},
      isDefault: userCompany.isDefault
    };

    next();

  } catch (error) {
    console.error('Error crítico en middleware de contexto de empresa:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno de validación de contexto.',
      code: 'COMPANY_CONTEXT_ERROR'
    });
  }
};

/**
 * Middleware que requiere contexto de empresa
 * Debe usarse después de companyContext
 */
const requireCompanyContext = (req, res, next) => {
  if (!req.companyContext) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere especificar una empresa válida',
      code: 'COMPANY_CONTEXT_REQUIRED'
    });
  }
  next();
};

/**
 * Middleware que verifica permisos específicos en la empresa
 * @param {string|Array} requiredPermissions - Permisos requeridos
 * @param {string} minRole - Rol mínimo requerido ('viewer', 'user', 'manager', 'admin')
 */
const requireCompanyPermission = (requiredPermissions = [], minRole = 'user') => {
  return (req, res, next) => {
    if (!req.companyContext) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere contexto de empresa',
        code: 'COMPANY_CONTEXT_REQUIRED'
      });
    }

    const { role, permissions } = req.companyContext;

    // Definir jerarquía de roles
    const roleHierarchy = {
      'viewer': 0,
      'user': 1,
      'manager': 2,
      'admin': 3
    };

    // Verificar rol mínimo
    if (roleHierarchy[role] < roleHierarchy[minRole]) {
      return res.status(403).json({
        success: false,
        message: `Se requiere rol mínimo de ${minRole}`,
        code: 'INSUFFICIENT_ROLE'
      });
    }

    // Verificar permisos específicos si se proporcionan
    if (requiredPermissions.length > 0) {
      const permissionsArray = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];

      const hasAllPermissions = permissionsArray.every(permission => {
        // Admin siempre tiene todos los permisos
        if (role === 'admin') return true;

        // Verificar permisos específicos
        return permissions[permission] === true;
      });

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          message: 'Permisos insuficientes para esta operación',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: permissionsArray
        });
      }
    }

    next();
  };
};

/**
 * Utility function para obtener filtro de empresa
 * Usado en controladores para filtrar automáticamente por empresa
 */
const getCompanyFilter = (req) => {
  if (!req.companyContext) {
    return {};
  }

  return {
    companyId: req.companyContext.companyId
  };
};

/**
 * Utility function para verificar si el usuario es admin de la empresa
 */
const isCompanyAdmin = (req) => {
  return req.companyContext && req.companyContext.role === 'admin';
};

/**
 * Utility function para verificar si el usuario es manager o superior
 */
const isCompanyManager = (req) => {
  return req.companyContext && ['admin', 'manager'].includes(req.companyContext.role);
};

module.exports = {
  companyContext,
  requireCompanyContext,
  requireCompanyPermission,
  getCompanyFilter,
  isCompanyAdmin,
  isCompanyManager
};