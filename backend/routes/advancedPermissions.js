const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');
const { 
  getAvailablePermissions,
  MODULE_PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getUserAvailablePermissions
} = require('../middleware/advancedPermissions');

// Aplicar middleware base
router.use(authenticateToken);
router.use(companyContext);

// GET /api/advanced-permissions/available - Obtener permisos disponibles del usuario actual
router.get('/available', requireCompanyContext, getAvailablePermissions);

// GET /api/advanced-permissions/modules - Obtener estructura de módulos y permisos
router.get('/modules', (req, res) => {
  res.json({
    success: true,
    modules: MODULE_PERMISSIONS,
    rolePermissions: ROLE_PERMISSIONS
  });
});

// GET /api/advanced-permissions/check/:permission - Verificar si el usuario tiene un permiso específico
router.get('/check/:permission', requireCompanyContext, (req, res) => {
  try {
    const { permission } = req.params;
    const { role, permissions } = req.companyContext;
    
    const hasAccess = hasPermission(role, permissions, permission);
    
    res.json({
      success: true,
      permission,
      hasAccess,
      role,
      companyId: req.companyContext.companyId
    });
    
  } catch (error) {
    console.error('Error al verificar permiso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/advanced-permissions/check-multiple - Verificar múltiples permisos
router.post('/check-multiple', requireCompanyContext, (req, res) => {
  try {
    const { permissions: permissionsToCheck } = req.body;
    
    if (!Array.isArray(permissionsToCheck)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de permisos'
      });
    }

    const { role, permissions } = req.companyContext;
    const results = {};
    
    permissionsToCheck.forEach(permission => {
      results[permission] = hasPermission(role, permissions, permission);
    });
    
    res.json({
      success: true,
      results,
      role,
      companyId: req.companyContext.companyId
    });
    
  } catch (error) {
    console.error('Error al verificar permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/advanced-permissions/user-summary - Resumen de permisos del usuario
router.get('/user-summary', requireCompanyContext, (req, res) => {
  try {
    const { role, permissions, companyId, company } = req.companyContext;
    
    const availablePermissions = getUserAvailablePermissions(role, permissions);
    
    // Agrupar permisos por módulo
    const permissionsByModule = {};
    availablePermissions.forEach(permission => {
      const [module] = permission.split('.');
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      permissionsByModule[module].push(permission);
    });
    
    res.json({
      success: true,
      summary: {
        userId: req.user.id,
        companyId,
        companyName: company.name,
        role,
        totalPermissions: availablePermissions.length,
        permissionsByModule,
        allPermissions: availablePermissions,
        customPermissions: permissions || {}
      }
    });
    
  } catch (error) {
    console.error('Error al obtener resumen de permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;