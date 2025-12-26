import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import dashboardService from '../services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { DollarSign, Users, Briefcase, FileText, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { selectedCompany } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (selectedCompany?.id) {
        setLoading(true);
        const response = await dashboardService.getDashboardMetrics(selectedCompany.id);
        if (response.success) {
          setMetrics(dashboardService.formatMetrics(response.data));
        }
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [selectedCompany]);

  if (loading || !metrics) {
    return <div className="p-8 text-center text-muted-foreground">Cargando métricas...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard General</h2>
        <p className="text-muted-foreground">Visión general del estado de la empresa.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Block 1: Commercial (Sales & Quotes) */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos y Cotizaciones</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.sales.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mb-4">Ingresos (Cotiz. Aceptadas)</p>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-sm font-medium">
                <span>Ganancia Estimada:</span>
                <span className="text-emerald-600">${metrics.sales.profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600 font-medium">
                <span>Aceptadas este mes:</span>
                <span>{metrics.sales.acceptedQuotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">En Borrador/Enviadas:</span>
                <span className="font-medium">{metrics.sales.activeQuotes}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor en juego:</span>
                <span className="font-medium text-amber-600">${metrics.sales.activeQuotesValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Block 2: Customers */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customers.total}</div>
            <p className="text-xs text-muted-foreground mb-4">Clientes Activos</p>

            <div className="flex items-center text-sm text-blue-600 font-medium pt-2 border-t">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{metrics.customers.newThisMonth} Nuevos este mes
            </div>
          </CardContent>
        </Card>

        {/* Block 3: Projects */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.projects.active}</div>
            <p className="text-xs text-muted-foreground">Proyectos en curso</p>
          </CardContent>
        </Card>

        {/* Block 4: Contracts */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.contracts.active}</div>
            <p className="text-xs text-muted-foreground mb-4">Contratos Vigentes</p>

            {metrics.contracts.expiringSoon > 0 ? (
              <div className="flex items-center text-sm text-red-600 font-medium pt-2 border-t">
                <AlertTriangle className="mr-1 h-3 w-3" />
                {metrics.contracts.expiringSoon} Por vencer (30 días)
              </div>
            ) : (
              <div className="flex items-center text-sm text-emerald-600 font-medium pt-2 border-t">
                <Clock className="mr-1 h-3 w-3" />
                Sin vencimientos próximos
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}