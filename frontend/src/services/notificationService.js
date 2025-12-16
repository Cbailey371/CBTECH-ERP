import api from './api';

const ENDPOINTS = {
  NOTIFICATIONS: '/notifications',
  PREFERENCES: '/notifications/preferences',
  MARK_READ: '/notifications/mark-read',
  MARK_ALL_READ: '/notifications/mark-all-read',
  DELETE: '/notifications'
};

class NotificationService {
  // Obtener notificaciones del usuario
  async getNotifications(userId, companyId, options = {}) {
    try {
      const params = {
        userId,
        companyId,
        ...options
      };
      
      const response = await api.get(ENDPOINTS.NOTIFICATIONS, { params });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener notificaciones'
      };
    }
  }

  // Crear nueva notificación
  async createNotification(notificationData) {
    try {
      const response = await api.post(ENDPOINTS.NOTIFICATIONS, notificationData);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error creando notificación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear notificación'
      };
    }
  }

  // Marcar notificación como leída
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`${ENDPOINTS.MARK_READ}/${notificationId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al marcar como leída'
      };
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead(userId, companyId) {
    try {
      const response = await api.put(ENDPOINTS.MARK_ALL_READ, {
        userId,
        companyId
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al marcar todas como leídas'
      };
    }
  }

  // Eliminar notificación
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`${ENDPOINTS.DELETE}/${notificationId}`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar notificación'
      };
    }
  }

  // Obtener preferencias de notificación
  async getPreferences(userId, companyId) {
    try {
      const response = await api.get(ENDPOINTS.PREFERENCES, {
        params: { userId, companyId }
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error obteniendo preferencias:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener preferencias',
        data: this.getDefaultPreferences() // Retornar preferencias por defecto
      };
    }
  }

  // Actualizar preferencias de notificación
  async updatePreferences(userId, companyId, preferences) {
    try {
      const response = await api.put(ENDPOINTS.PREFERENCES, {
        userId,
        companyId,
        preferences
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar preferencias'
      };
    }
  }

  // Obtener tipos de notificación disponibles
  getNotificationTypes() {
    return {
      SALE_CREATED: {
        id: 'sale_created',
        name: 'Nueva Venta',
        category: 'sales',
        description: 'Se registró una nueva venta',
        defaultEnabled: true
      },
      CUSTOMER_REGISTERED: {
        id: 'customer_registered',
        name: 'Cliente Registrado',
        category: 'customers',
        description: 'Se registró un nuevo cliente',
        defaultEnabled: true
      },
      LOW_STOCK: {
        id: 'low_stock',
        name: 'Stock Bajo',
        category: 'inventory',
        description: 'Producto con stock bajo',
        defaultEnabled: true
      },
      ORDER_COMPLETED: {
        id: 'order_completed',
        name: 'Orden Completada',
        category: 'sales',
        description: 'Se completó una orden',
        defaultEnabled: true
      },
      PAYMENT_RECEIVED: {
        id: 'payment_received',
        name: 'Pago Recibido',
        category: 'financial',
        description: 'Se recibió un pago',
        defaultEnabled: true
      },
      SYSTEM_UPDATE: {
        id: 'system_update',
        name: 'Actualización del Sistema',
        category: 'system',
        description: 'Actualizaciones del sistema',
        defaultEnabled: false
      },
      USER_LOGIN: {
        id: 'user_login',
        name: 'Inicio de Sesión',
        category: 'system',
        description: 'Usuario inició sesión',
        defaultEnabled: false
      },
      INVOICE_GENERATED: {
        id: 'invoice_generated',
        name: 'Factura Generada',
        category: 'financial',
        description: 'Se generó una nueva factura',
        defaultEnabled: true
      }
    };
  }

  // Obtener categorías de notificación
  getCategories() {
    return {
      sales: {
        name: 'Ventas',
        description: 'Notificaciones relacionadas con ventas',
        icon: 'AttachMoney',
        color: 'success'
      },
      customers: {
        name: 'Clientes',
        description: 'Notificaciones de clientes',
        icon: 'People',
        color: 'info'
      },
      inventory: {
        name: 'Inventario',
        description: 'Notificaciones de inventario',
        icon: 'Inventory',
        color: 'warning'
      },
      financial: {
        name: 'Financiero',
        description: 'Notificaciones financieras',
        icon: 'AccountBalance',
        color: 'primary'
      },
      system: {
        name: 'Sistema',
        description: 'Notificaciones del sistema',
        icon: 'Settings',
        color: 'default'
      }
    };
  }

  // Preferencias por defecto
  getDefaultPreferences() {
    return {
      email: true,
      browser: true,
      inApp: true,
      sound: false,
      categories: {
        sales: true,
        inventory: true,
        customers: true,
        system: true,
        financial: true
      },
      frequency: 'immediate', // immediate, hourly, daily
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  // Formatear notificación para mostrar
  formatNotification(notification) {
    const types = this.getNotificationTypes();
    const categories = this.getCategories();
    
    return {
      ...notification,
      typeInfo: types[notification.type] || { name: notification.type, category: 'system' },
      categoryInfo: categories[notification.category] || categories.system,
      timeAgo: this.getTimeAgo(notification.createdAt),
      isRecent: this.isRecent(notification.createdAt)
    };
  }

  // Calcular tiempo transcurrido
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    }
  }

  // Verificar si es una notificación reciente
  isRecent(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    return diffInMinutes <= 30; // Considerar reciente si es menor a 30 minutos
  }

  // Generar notificaciones de ejemplo
  getMockNotifications(userId, companyId) {
    const types = Object.values(this.getNotificationTypes());
    const notifications = [];
    
    for (let i = 0; i < 10; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const notification = {
        id: `mock_${i}`,
        userId,
        companyId,
        type: type.id,
        category: type.category,
        title: type.name,
        message: this.generateMockMessage(type),
        read: Math.random() > 0.6,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        data: this.generateMockData(type)
      };
      
      notifications.push(this.formatNotification(notification));
    }
    
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  generateMockMessage(type) {
    const messages = {
      sale_created: 'Se registró una nueva venta por $1,250.00',
      customer_registered: 'Nuevo cliente registrado: Juan Pérez',
      low_stock: 'Producto "Laptop Dell" tiene stock bajo (5 unidades)',
      order_completed: 'Orden #12345 ha sido completada',
      payment_received: 'Pago de $850.00 recibido de Cliente ABC',
      system_update: 'Sistema actualizado a la versión 2.1.0',
      user_login: 'Usuario María García inició sesión',
      invoice_generated: 'Factura #INV-001234 generada exitosamente'
    };
    
    return messages[type.id] || `Notificación de ${type.name}`;
  }

  generateMockData(type) {
    const dataMap = {
      sale_created: { saleId: '12345', amount: 1250, customerId: '567' },
      customer_registered: { customerId: '567', name: 'Juan Pérez' },
      low_stock: { productId: '123', productName: 'Laptop Dell', stock: 5 },
      order_completed: { orderId: '12345', customerId: '567' },
      payment_received: { paymentId: '789', amount: 850, customerId: '567' },
      system_update: { version: '2.1.0' },
      user_login: { userId: '999', userName: 'María García' },
      invoice_generated: { invoiceId: 'INV-001234', amount: 1250 }
    };
    
    return dataMap[type.id] || {};
  }
}

export default new NotificationService();