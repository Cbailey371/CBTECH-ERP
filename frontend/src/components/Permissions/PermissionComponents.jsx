import React from 'react';
import { Box, Alert, CircularProgress } from '@mui/material';
import { usePermissions } from '../../context/PermissionsContext';
import { useCompany } from '../../context/CompanyContext';

const renderLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
    <CircularProgress size={20} />
  </Box>
);

const renderFallback = (fallback, showMessage) => {
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showMessage) {
    return (
      <Alert severity="warning">
        No tienes permisos para acceder a esta sección.
      </Alert>
    );
  }

  return null;
};

const normalizePermissions = (permission, permissions) => {
  const required = [];
  if (permission) {
    required.push(permission);
  }
  if (Array.isArray(permissions)) {
    permissions.forEach((perm) => {
      if (perm && !required.includes(perm)) {
        required.push(perm);
      }
    });
  }
  return required;
};

/**
 * Componente que renderiza children solo si el usuario tiene los permisos requeridos.
 */
export const PermissionGuard = ({
  children,
  permission,
  permissions = [],
  fallback = null,
  showMessage = false
}) => {
  const {
    loading,
    hasPermission,
    hasAllPermissions
  } = usePermissions();

  const required = React.useMemo(
    () => normalizePermissions(permission, permissions),
    [permission, permissions]
  );

  if (loading) {
    return renderLoading();
  }

  const isAllowed = required.length === 0
    ? true
    : required.length === 1
      ? hasPermission(required[0])
      : hasAllPermissions(required);

  if (isAllowed) {
    return <>{children}</>;
  }

  return renderFallback(fallback, showMessage);
};

/**
 * HOC que envuelve un componente con verificación de permisos
 */
export const withPermissions = (WrappedComponent, requiredPermissions = []) => {
  const GuardedComponent = (props) => (
    <PermissionGuard permissions={requiredPermissions}>
      <WrappedComponent {...props} />
    </PermissionGuard>
  );
  GuardedComponent.displayName = `WithPermissions(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return GuardedComponent;
};

/**
 * Guard específico para módulos
 */
export const ModuleGuard = ({
  children,
  module,
  action = 'view',
  fallback = null
}) => {
  const { loading, canPerformAction } = usePermissions();

  if (loading) {
    return renderLoading();
  }

  if (!module) {
    return renderFallback(fallback, true);
  }

  const hasAccess = canPerformAction(module, action);

  if (hasAccess) {
    return <>{children}</>;
  }

  return renderFallback(fallback, true);
};

/**
 * Guard basado en roles
 */
export const RoleGuard = ({
  children,
  roles = [],
  fallback = null
}) => {
  const { currentCompany } = useCompany();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  if (!allowedRoles.length) {
    return <>{children}</>;
  }

  const userRole = currentCompany?.role;
  const hasRole = userRole ? allowedRoles.includes(userRole) : false;

  if (hasRole) {
    return <>{children}</>;
  }

  return renderFallback(fallback, true);
};
