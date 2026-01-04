const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../models');

// Middleware para verificar el token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const companyId = req.headers['x-company-id']; // Extract company ID from header

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token inválido'
      });
    }
    req.user = user;
    if (companyId) {
      req.user.companyId = parseInt(companyId); // Attach to user object for easy access in controllers
    }
    next();
  });
};

// Middleware para verificar permisos específicos
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Este middleware debe ejecutarse después de authenticateToken
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Buscar el usuario con sus roles y permisos
      const userWithRoles = await User.findByPk(req.user.id, {
        include: [{
          model: Role,
          as: 'roles',
          where: { is_active: true },
          required: false,
          include: [{
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }]
        }]
      });

      if (!userWithRoles) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Obtener todos los permisos del usuario
      const userPermissions = [];
      userWithRoles.roles.forEach(role => {
        role.permissions.forEach(perm => {
          if (!userPermissions.includes(perm.name)) {
            userPermissions.push(perm.name);
          }
        });
      });

      // Verificar si el usuario tiene el permiso requerido
      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para realizar esta acción'
        });
      }

      next();
    } catch (error) {
      console.error('Error en middleware de permisos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Middleware para verificar si el usuario es administrador
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Buscar el usuario con sus roles
    const userWithRoles = await User.findByPk(req.user.id, {
      include: [{
        model: Role,
        as: 'roles',
        where: {
          name: ['super_admin', 'admin'],
          is_active: true
        },
        required: false
      }]
    });

    if (!userWithRoles || userWithRoles.roles.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en middleware de administrador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  authenticateToken,
  requireAuth: authenticateToken,
  requirePermission,
  requireAdmin
};