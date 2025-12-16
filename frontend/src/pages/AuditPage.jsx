import React from 'react';
import TopAppBar from '../components/Layout/TopAppBar';
import AuditPanel from '../components/Audit/AuditPanel';
import { usePermissions } from '../context/PermissionsContext';
import { PermissionGuard } from '../components/Permissions/PermissionComponents';

const AuditPage = () => {
  const { loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-foreground">
        Cargando sistema de auditoría...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopAppBar />
      <PermissionGuard
        permission="audit.view"
        fallback={
          <div className="text-center mt-32 p-4 text-foreground">
            <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground">No tienes permisos para ver el sistema de auditoría</p>
          </div>
        }
      >
        <AuditPanel />
      </PermissionGuard>
    </div>
  );
};

export default AuditPage;