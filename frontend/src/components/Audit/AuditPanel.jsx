import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useCompany } from '../../context/CompanyContext';
import { usePermissions } from '../../context/PermissionsContext';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

const AuditPanel = () => {
  const { currentCompany } = useCompany();
  const { hasPermission } = usePermissions();

  if (!hasPermission('audit.view')) {
    return (
      <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-warning flex items-center gap-2">
        <ShieldAlert size={20} />
        No tienes permisos para ver los logs de auditoría
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-bold text-foreground">Auditoría del Sistema</h1>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl text-foreground">Panel de Auditoría</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            El sistema de auditoría está en desarrollo.
            Próximamente podrás ver todos los logs de actividad del sistema.
          </p>

          {currentCompany && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center gap-2">
              <ShieldCheck size={20} />
              <span>Empresa actual: {currentCompany.company?.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditPanel;