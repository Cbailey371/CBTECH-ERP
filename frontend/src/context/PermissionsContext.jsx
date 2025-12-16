import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCompany } from './CompanyContext';
import { useAuth } from './AuthContext';
import advancedPermissionsService from '../services/advancedPermissionsService';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions debe ser usado dentro de un PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  const { currentCompany } = useCompany();
  
  const [permissions, setPermissions] = useState([]);
  const [permissionsByModule, setPermissionsByModule] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modulesStructure, setModulesStructure] = useState({});

  // Cargar permisos cuando cambia el usuario o la empresa
  useEffect(() => {
    if (user && currentCompany) {
      loadUserPermissions();
    } else {
      // Limpiar permisos si no hay usuario o empresa
      resetPermissions();
    }
  }, [user, currentCompany]);

  // Cargar estructura de módulos al inicializar
  useEffect(() => {
    loadModulesStructure();
  }, []);

  const resetPermissions = () => {
    setPermissions([]);
    setPermissionsByModule({});
    setUserRole(null);
    setError(null);
  };

  const loadModulesStructure = async () => {
    try {
      const response = await advancedPermissionsService.getModulesStructure();
      setModulesStructure(response.modules || {});
    } catch (error) {
      console.error('Error al cargar estructura de módulos:', error);
    }
  };

  const loadUserPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summaryResponse, availableResponse] = await Promise.all([
        advancedPermissionsService.getUserSummary(),
        advancedPermissionsService.getAvailablePermissions()
      ]);
      
      const summary = summaryResponse.summary || {};
      const available = availableResponse || {};
      
      setPermissions(summary.allPermissions || []);
      setPermissionsByModule(summary.permissionsByModule || {});
      setUserRole(summary.role);
      
    } catch (error) {
      console.error('Error al cargar permisos del usuario:', error);
      setError('Error al cargar permisos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission) => {
    if (!permission) return false;
    if (userRole === 'admin') return true;
    return permissions.includes(permission);
  };

  // Verificar si el usuario tiene alguno de los permisos especificados
  const hasAnyPermission = (permissionsList) => {
    if (!Array.isArray(permissionsList)) return false;
    if (userRole === 'admin') return true;
    return permissionsList.some(permission => permissions.includes(permission));
  };

  // Verificar si el usuario tiene todos los permisos especificados
  const hasAllPermissions = (permissionsList) => {
    if (!Array.isArray(permissionsList)) return false;
    if (userRole === 'admin') return true;
    return permissionsList.every(permission => permissions.includes(permission));
  };

  // Verificar permisos por módulo
  const hasModuleAccess = (module) => {
    if (userRole === 'admin') return true;
    return permissionsByModule[module] && permissionsByModule[module].length > 0;
  };

  // Obtener permisos de un módulo específico
  const getModulePermissions = (module) => {
    return permissionsByModule[module] || [];
  };

  // Verificar si puede realizar una acción específica en un módulo
  const canPerformAction = (module, action) => {
    const permission = `${module}.${action}`;
    return hasPermission(permission);
  };

  // Obtener información detallada de un permiso
  const getPermissionInfo = (permission) => {
    const [module, action] = permission.split('.');
    if (modulesStructure[module] && modulesStructure[module].permissions[permission]) {
      return {
        module: modulesStructure[module].name,
        ...modulesStructure[module].permissions[permission]
      };
    }
    return null;
  };

  // Verificar permisos en tiempo real (útil para llamadas API)
  const checkPermissionAsync = async (permission) => {
    try {
      const response = await advancedPermissionsService.checkPermission(permission);
      return response.hasAccess;
    } catch (error) {
      console.error('Error al verificar permiso:', error);
      return false;
    }
  };

  // Verificar múltiples permisos en tiempo real
  const checkMultiplePermissionsAsync = async (permissionsList) => {
    try {
      const response = await advancedPermissionsService.checkMultiplePermissions(permissionsList);
      return response.results || {};
    } catch (error) {
      console.error('Error al verificar permisos:', error);
      return {};
    }
  };

  // Refrescar permisos
  const refreshPermissions = () => {
    if (user && currentCompany) {
      loadUserPermissions();
    }
  };

  const value = {
    // Estado
    permissions,
    permissionsByModule,
    userRole,
    loading,
    error,
    modulesStructure,
    
    // Verificaciones básicas
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasModuleAccess,
    
    // Utilidades por módulo
    getModulePermissions,
    canPerformAction,
    getPermissionInfo,
    
    // Verificaciones asíncronas
    checkPermissionAsync,
    checkMultiplePermissionsAsync,
    
    // Acciones
    refreshPermissions,
    
    // Información calculada
    totalPermissions: permissions.length,
    availableModules: Object.keys(permissionsByModule),
    isAdmin: userRole === 'admin',
    isManager: ['admin', 'manager'].includes(userRole),
    hasAnyPermissions: permissions.length > 0
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};