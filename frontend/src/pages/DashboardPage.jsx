import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import dashboardService from '../services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DollarSign, Users, Briefcase, FileText, AlertTriangle, TrendingUp, Clock, CreditCard, BarChart as BarChartIcon } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function DashboardPage() {
  const { selectedCompany } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for Filters
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    fetchMetrics();
  }, [selectedCompany, startDate, endDate]);

  const fetchMetrics = async () => {
    if (selectedCompany?.id) {
      setLoading(true);
      // Pass custom dates
      const response = await dashboardService.getDashboardMetrics(selectedCompany.id, 'custom', startDate, endDate);
      if (response.success) {
        setMetrics(dashboardService.formatMetrics(response.data));
      }
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return <div className="p-8 text-center text-muted-foreground">Cargando métricas...</div>;
  }

  // Helper to render chart based on selection
  const renderChart = () => {
    const commonProps = {
      data: metrics.sales.analytics,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    const components = {
      bar: (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} labelFormatter={(label) => `Fecha ${label}`} />
          <Legend />
          <Bar dataKey="invoices" name="Facturación" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="creditNotes" name="Notas de Crédito" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Bar dataKey="quotations" name="Cotizaciones (Aceptadas)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      ),
      line: (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} labelFormatter={(label) => `Fecha ${label}`} />
          <Legend />
          <Line type="monotone" dataKey="invoices" name="Facturación" stroke="#10b981" strokeWidth={2} />
          <Line type="monotone" dataKey="creditNotes" name="Notas de Crédito" stroke="#ef4444" strokeWidth={2} />
          <Line type="monotone" dataKey="quotations" name="Cotizaciones (Aceptadas)" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      ),
      area: (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, '']} labelFormatter={(label) => `Fecha ${label}`} />
          <Legend />
          <Area type="monotone" dataKey="invoices" name="Facturación" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
          <Area type="monotone" dataKey="creditNotes" name="Notas de Crédito" fill="#ef4444" stroke="#ef4444" fillOpacity={0.3} />
          <Area type="monotone" dataKey="quotations" name="Cotizaciones (Aceptadas)" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />
        </AreaChart>
      )
    };

    return components[chartType] || components.bar;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard General</h2>
          <p className="text-muted-foreground">Visión general del estado de la empresa.</p>
        </div>

        {/* Date Filter & Actions */}
        <div className="flex flex-col sm:flex-row gap-2 items-center bg-card p-2 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Desde:</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-36 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Hasta:</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-36 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* INGRESOS Y COTIZACIONES (Original) */}
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
                <span>Aceptadas en periodo:</span>
                <span>{metrics.sales.acceptedQuotes ?? 0}</span>
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

        {/* FACTURACIÓN PERIODO */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturación</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.sales.invoicesTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Total emitido en periodo</p>
          </CardContent>
        </Card>

        {/* NOTAS CRÉDITO PERIODO */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notas de Crédito</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.sales.creditNotesTotal?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Total autorizado en periodo</p>
          </CardContent>
        </Card>

        {/* CLIENTES */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.customers.total}</div>
            <div className="flex items-center text-sm text-blue-600 font-medium pt-1">
              <TrendingUp className="mr-1 h-3 w-3" />
              +{metrics.customers.newThisMonth} Nuevos en periodo
            </div>
          </CardContent>
        </Card>

        {/* PROYECTOS */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.projects.active}</div>
            <p className="text-xs text-muted-foreground">En planificación o curso</p>
          </CardContent>
        </Card>
      </div>

      {/* ANALYTICS CHART */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Analíticas del Periodo</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="xs"
                onClick={() => setChartType('bar')}
                className="h-7"
              >
                Barras
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="xs"
                onClick={() => setChartType('line')}
                className="h-7"
              >
                Líneas
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="xs"
                onClick={() => setChartType('area')}
                className="h-7"
              >
                Área
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}