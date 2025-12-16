import api from './api';

const ENDPOINTS = {
  AUDIT_LOGS: '/audit',
  AUDIT_STATS: '/audit/stats',
  USER_ACTIVITY: '/audit/user',
  EXPORT_REPORT: '/audit/export',
  EVENT_DETAILS: '/audit/event'
};

class AuditService {
  // Obtener logs de auditoría
  async getAuditLogs(params = {}) {
    try {
      const response = await api.get(ENDPOINTS.AUDIT_LOGS, { params });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo logs de auditoría:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener logs de auditoría'
      };
    }
  }

  // Obtener estadísticas de auditoría
  async getAuditStats(period = 'week') {
    try {
      const response = await api.get(ENDPOINTS.AUDIT_STATS, {
        params: { period }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de auditoría:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener estadísticas'
      };
    }
  }

  // Obtener actividad de un usuario específico
  async getUserActivity(userId, limit = 20) {
    try {
      const response = await api.get(`${ENDPOINTS.USER_ACTIVITY}/${userId}`, {
        params: { limit }
      });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo actividad del usuario:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener actividad del usuario'
      };
    }
  }

  // Exportar reporte de auditoría
  async exportAuditReport(params = {}) {
    try {
      const response = await api.get(ENDPOINTS.EXPORT_REPORT, { params });
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error exportando reporte de auditoría:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al exportar reporte'
      };
    }
  }

  // Obtener detalles de un evento específico
  async getEventDetails(eventId) {
    try {
      const response = await api.get(`${ENDPOINTS.EVENT_DETAILS}/${eventId}`);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error obteniendo detalles del evento:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener detalles del evento'
      };
    }
  }

  // Formatear log de auditoría para mostrar
  formatAuditLog(log) {
    return {
      ...log,
      formattedTimestamp: this.formatTimestamp(log.timestamp),
      actionLabel: this.getActionLabel(log.action),
      resourceLabel: this.getResourceLabel(log.resource),
      statusLabel: log.responseSuccess ? 'Éxito' : 'Error',
      isRecent: this.isRecent(log.timestamp),
      duration: log.details?.duration || null
    };
  }

  // Formatear timestamp
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Obtener etiqueta de acción
  getActionLabel(action) {
    const actionLabels = {
      view: 'Ver',
      create: 'Crear',
      update: 'Actualizar',
      delete: 'Eliminar',
      login: 'Iniciar Sesión',
      logout: 'Cerrar Sesión',
      export: 'Exportar',
      import: 'Importar'
    };
    
    return actionLabels[action] || action;
  }

  // Obtener etiqueta de recurso
  getResourceLabel(resource) {
    const resourceLabels = {
      customers: 'Clientes',
      products: 'Productos',
      sales: 'Ventas',
      purchases: 'Compras',
      dashboard: 'Dashboard',
      users: 'Usuarios',
      reports: 'Reportes',
      notifications: 'Notificaciones',
      audit: 'Auditoría',
      companies: 'Empresas'
    };
    
    return resourceLabels[resource] || resource;
  }

  // Verificar si es un evento reciente
  isRecent(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    return diffInMinutes <= 60; // Considerar reciente si es menor a 1 hora
  }

  // Obtener colores para diferentes elementos
  getActionColor(action) {
    const colorMap = {
      view: 'info',
      create: 'success',
      update: 'warning',
      delete: 'error',
      login: 'primary',
      logout: 'secondary',
      export: 'default',
      import: 'default'
    };
    return colorMap[action] || 'default';
  }

  getStatusColor(success) {
    return success ? 'success' : 'error';
  }

  // Obtener filtros disponibles
  getAvailableFilters() {
    return {
      actions: [
        { value: 'view', label: 'Ver' },
        { value: 'create', label: 'Crear' },
        { value: 'update', label: 'Actualizar' },
        { value: 'delete', label: 'Eliminar' },
        { value: 'login', label: 'Iniciar Sesión' },
        { value: 'logout', label: 'Cerrar Sesión' },
        { value: 'export', label: 'Exportar' }
      ],
      resources: [
        { value: 'customers', label: 'Clientes' },
        { value: 'products', label: 'Productos' },
        { value: 'sales', label: 'Ventas' },
        { value: 'purchases', label: 'Compras' },
        { value: 'dashboard', label: 'Dashboard' },
        { value: 'users', label: 'Usuarios' },
        { value: 'reports', label: 'Reportes' }
      ],
      statuses: [
        { value: 'true', label: 'Exitoso' },
        { value: 'false', label: 'Error' }
      ]
    };
  }

  // Generar resumen de actividad
  generateActivitySummary(logs) {
    if (!logs || logs.length === 0) {
      return {
        totalEvents: 0,
        successRate: 0,
        topActions: [],
        topResources: [],
        timeRange: null
      };
    }

    const totalEvents = logs.length;
    const successfulEvents = logs.filter(log => log.responseSuccess).length;
    const successRate = (successfulEvents / totalEvents * 100).toFixed(1);

    // Agrupar por acción
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const topActions = Object.entries(actionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({
        action,
        label: this.getActionLabel(action),
        count
      }));

    // Agrupar por recurso
    const resourceCounts = logs.reduce((acc, log) => {
      acc[log.resource] = (acc[log.resource] || 0) + 1;
      return acc;
    }, {});

    const topResources = Object.entries(resourceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([resource, count]) => ({
        resource,
        label: this.getResourceLabel(resource),
        count
      }));

    // Rango de tiempo
    const timestamps = logs.map(log => new Date(log.timestamp));
    const timeRange = {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps))
    };

    return {
      totalEvents,
      successRate: parseFloat(successRate),
      topActions,
      topResources,
      timeRange
    };
  }

  // Validar filtros
  validateFilters(filters) {
    const errors = [];

    if (filters.startDate && filters.endDate) {
      if (new Date(filters.startDate) > new Date(filters.endDate)) {
        errors.push('La fecha de inicio debe ser anterior a la fecha de fin');
      }
    }

    if (filters.startDate && new Date(filters.startDate) > new Date()) {
      errors.push('La fecha de inicio no puede ser futura');
    }

    if (filters.endDate && new Date(filters.endDate) > new Date()) {
      errors.push('La fecha de fin no puede ser futura');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generar datos de ejemplo para desarrollo
  generateMockAuditLogs(count = 50) {
    const actions = ['view', 'create', 'update', 'delete', 'login', 'logout'];
    const resources = ['customers', 'products', 'sales', 'dashboard', 'users'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const users = [
      { id: 'user1', name: 'Juan Pérez', email: 'juan@empresa.com' },
      { id: 'user2', name: 'María García', email: 'maria@empresa.com' },
      { id: 'user3', name: 'Carlos López', email: 'carlos@empresa.com' }
    ];

    const logs = [];

    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resource = resources[Math.floor(Math.random() * resources.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      const success = Math.random() > 0.1; // 90% éxito

      logs.push({
        id: `audit_${Date.now()}_${i}`,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action,
        resource,
        method,
        endpoint: `/api/${resource}`,
        statusCode: success ? 200 : (Math.random() > 0.5 ? 400 : 500),
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (compatible)',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        responseSuccess: success,
        details: {
          module: resource,
          requestId: `req_${Date.now()}_${i}`,
          sessionId: `sess_${Math.floor(Math.random() * 1000)}`,
          duration: Math.floor(Math.random() * 1000) + 100
        }
      });
    }

    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
}

export default new AuditService();