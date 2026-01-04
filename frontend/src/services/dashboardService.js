import api from './api';

const ENDPOINTS = {
  DASHBOARD_METRICS: '/dashboard/metrics',
  DASHBOARD_ACTIVITY: '/dashboard/activity',
  DASHBOARD_REPORTS: '/dashboard/reports'
};

class DashboardService {
  // Obtener métricas principales del dashboard
  async getDashboardMetrics(companyId, period = 'month', startDate = null, endDate = null) {
    try {
      const params = {
        companyId,
        period,
        timestamp: new Date().getTime()
      };

      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const response = await api.get(ENDPOINTS.DASHBOARD_METRICS, { params });

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo métricas del dashboard:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener métricas'
      };
    }
  }

  // Obtener actividad reciente
  async getRecentActivity(companyId, limit = 10) {
    try {
      const response = await api.get(ENDPOINTS.DASHBOARD_ACTIVITY, {
        params: {
          companyId,
          limit
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener actividad'
      };
    }
  }

  // Obtener datos para reportes rápidos
  async getQuickReports(companyId) {
    try {
      const response = await api.get(ENDPOINTS.DASHBOARD_REPORTS, {
        params: { companyId }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error obteniendo reportes rápidos:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener reportes'
      };
    }
  }

  // Obtener KPIs específicos por módulo
  async getModuleKPIs(companyId, module) {
    try {
      const response = await api.get(`/dashboard/kpis/${module}`, {
        params: { companyId }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error(`Error obteniendo KPIs del módulo ${module}:`, error);
      return {
        success: false,
        error: error.response?.data?.message || `Error al obtener KPIs de ${module}`
      };
    }
  }

  // Formatear métricas para el dashboard
  formatMetrics(rawMetrics) {
    return {
      sales: {
        total: rawMetrics.sales?.total || 0,
        invoicesTotal: rawMetrics.sales?.invoicesTotal || 0,
        creditNotesTotal: rawMetrics.sales?.creditNotesTotal || 0,
        analytics: rawMetrics.sales?.analytics || [],
        profit: rawMetrics.sales?.profit || 0,
        trend: rawMetrics.sales?.trend || 0,
        activeQuotes: rawMetrics.sales?.activeQuotes || 0,
        activeQuotesValue: rawMetrics.sales?.activeQuotesValue || 0,
        acceptedQuotes: rawMetrics.sales?.acceptedQuotes || 0,
        period: rawMetrics.sales?.period || 'Este mes',
        currency: rawMetrics.sales?.currency || 'PAB',
        loading: false
      },
      customers: {
        total: rawMetrics.customers?.total || 0,
        trend: rawMetrics.customers?.trend || 0,
        newThisMonth: rawMetrics.customers?.newThisMonth || 0,
        period: 'Total activos',
        loading: false
      },
      projects: {
        active: rawMetrics.projects?.active || 0,
        trend: rawMetrics.projects?.trend || 0,
        loading: false
      },
      contracts: {
        active: rawMetrics.contracts?.active || 0,
        expiringSoon: rawMetrics.contracts?.expiringSoon || 0,
        loading: false
      },
      products: {
        total: rawMetrics.products?.total || 0,
        lowStock: rawMetrics.products?.lowStock || 0,
        outOfStock: rawMetrics.products?.outOfStock || 0,
        trend: rawMetrics.products?.trend || 0,
        period: 'En inventario',
        loading: false
      },
      orders: {
        pending: rawMetrics.orders?.pending || 0,
        completed: rawMetrics.orders?.completed || 0,
        cancelled: rawMetrics.orders?.cancelled || 0,
        trend: rawMetrics.orders?.trend || 0,
        period: 'Esta semana',
        loading: false
      },
      financial: {
        revenue: rawMetrics.financial?.revenue || 0,
        expenses: rawMetrics.financial?.expenses || 0,
        profit: rawMetrics.financial?.profit || 0,
        profitMargin: rawMetrics.financial?.profitMargin || 0,
        trend: rawMetrics.financial?.trend || 0,
        loading: false
      }
    };
  }

  // Obtener configuración del dashboard por usuario
  async getDashboardConfig(userId, companyId) {
    try {
      const response = await api.get('/dashboard/config', {
        params: { userId, companyId }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error obteniendo configuración del dashboard:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener configuración'
      };
    }
  }

  // Guardar configuración del dashboard
  async saveDashboardConfig(userId, companyId, config) {
    try {
      const response = await api.post('/dashboard/config', {
        userId,
        companyId,
        config
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error guardando configuración del dashboard:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al guardar configuración'
      };
    }
  }

  // Obtener comparativa con períodos anteriores
  async getComparativeData(companyId, currentPeriod, previousPeriod) {
    try {
      const response = await api.get('/dashboard/comparative', {
        params: {
          companyId,
          currentPeriod,
          previousPeriod
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error obteniendo datos comparativos:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener comparativa'
      };
    }
  }

  // Datos de ejemplo para desarrollo
  getMockMetrics(companyId) {
    return {
      sales: {
        total: Math.floor(Math.random() * 200000) + 50000,
        trend: (Math.random() - 0.5) * 30,
        period: 'Este mes',
        currency: 'PAB'
      },
      customers: {
        total: Math.floor(Math.random() * 2000) + 500,
        trend: (Math.random() - 0.3) * 20,
        newThisMonth: Math.floor(Math.random() * 50) + 10
      },
      products: {
        total: Math.floor(Math.random() * 500) + 100,
        lowStock: Math.floor(Math.random() * 30) + 5,
        outOfStock: Math.floor(Math.random() * 10),
        trend: (Math.random() - 0.4) * 15
      },
      orders: {
        pending: Math.floor(Math.random() * 100) + 20,
        completed: Math.floor(Math.random() * 300) + 100,
        cancelled: Math.floor(Math.random() * 20) + 2,
        trend: (Math.random() - 0.2) * 25
      },
      financial: {
        revenue: Math.floor(Math.random() * 150000) + 80000,
        expenses: Math.floor(Math.random() * 100000) + 60000,
        profit: 0, // Se calculará
        profitMargin: 0, // Se calculará
        trend: (Math.random() - 0.3) * 20
      }
    };
  }

  getMockActivity(companyId) {
    const activities = [
      { type: 'sale', message: 'Nueva venta por $1,250.00', time: '2 min ago', icon: 'money' },
      { type: 'customer', message: 'Cliente registrado: Juan Pérez', time: '15 min ago', icon: 'person' },
      { type: 'inventory', message: 'Producto con stock bajo: Laptop Dell', time: '1 hora ago', icon: 'warning' },
      { type: 'order', message: 'Orden completada #12345', time: '2 horas ago', icon: 'check' },
      { type: 'payment', message: 'Pago recibido de Cliente ABC', time: '3 horas ago', icon: 'payment' },
      { type: 'product', message: 'Nuevo producto agregado: Mouse Logitech', time: '4 horas ago', icon: 'add' }
    ];

    return activities.slice(0, Math.floor(Math.random() * 4) + 3);
  }
}

export default new DashboardService();