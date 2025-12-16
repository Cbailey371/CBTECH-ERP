const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');
const { requireAdvancedPermissions } = require('../middleware/advancedPermissions');

// Middleware para todas las rutas de notificaciones
router.use(requireAuth);
router.use(companyContext);
router.use(requireCompanyContext);

// Obtener notificaciones del usuario
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.companyContext;
    const { onlyNew, limit = 50, offset = 0 } = req.query;
    
    // Aquí iría la consulta real a la base de datos
    // Por ahora usamos datos de ejemplo
    
    const notifications = generateMockNotifications(userId, companyId, {
      onlyNew: onlyNew === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const unreadCount = notifications.filter(n => !n.read).length;
    
    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener notificaciones'
    });
  }
});

// Crear nueva notificación
router.post('/', requireAdvancedPermissions(['notifications.create']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.companyContext;
    const { type, category, title, message, data, targetUserId } = req.body;
    
    // Validar datos requeridos
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Tipo, título y mensaje son requeridos'
      });
    }
    
    // Crear notificación (simulado)
    const notification = {
      id: `notif_${Date.now()}`,
      userId: targetUserId || userId,
      companyId,
      type,
      category: category || 'system',
      title,
      message,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString(),
      createdBy: userId
    };
    
    // Aquí iría la lógica para guardar en la base de datos
    console.log('Nueva notificación creada:', notification);
    
    // Simular envío en tiempo real (aquí iría WebSocket o similar)
    // notifyUser(notification);
    
    res.status(201).json({
      success: true,
      data: notification
    });
    
  } catch (error) {
    console.error('Error creando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear notificación'
    });
  }
});

// Marcar notificación como leída
router.put('/mark-read/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Verificar que la notificación pertenece al usuario
    // Aquí iría la consulta real
    
    console.log(`Marcando notificación ${notificationId} como leída para usuario ${userId}`);
    
    res.json({
      success: true,
      message: 'Notificación marcada como leída'
    });
    
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar notificación como leída'
    });
  }
});

// Marcar todas las notificaciones como leídas
router.put('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.companyContext;
    
    // Aquí iría la actualización masiva en la base de datos
    console.log(`Marcando todas las notificaciones como leídas para usuario ${userId} en empresa ${companyId}`);
    
    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
    
  } catch (error) {
    console.error('Error marcando todas como leídas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar todas como leídas'
    });
  }
});

// Eliminar notificación
router.delete('/:notificationId', async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    // Verificar que la notificación pertenece al usuario
    // Aquí iría la consulta y eliminación real
    
    console.log(`Eliminando notificación ${notificationId} para usuario ${userId}`);
    
    res.json({
      success: true,
      message: 'Notificación eliminada'
    });
    
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notificación'
    });
  }
});

// Obtener preferencias de notificación
router.get('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.companyContext;
    
    // Aquí iría la consulta real a la base de datos
    // Por ahora retornamos preferencias por defecto
    
    const preferences = {
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
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
    
    res.json({
      success: true,
      data: preferences
    });
    
  } catch (error) {
    console.error('Error obteniendo preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener preferencias'
    });
  }
});

// Actualizar preferencias de notificación
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.companyContext;
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Preferencias inválidas'
      });
    }
    
    // Aquí iría la actualización en la base de datos
    console.log(`Actualizando preferencias para usuario ${userId} en empresa ${companyId}:`, preferences);
    
    res.json({
      success: true,
      message: 'Preferencias actualizadas',
      data: preferences
    });
    
  } catch (error) {
    console.error('Error actualizando preferencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar preferencias'
    });
  }
});

// Obtener estadísticas de notificaciones
router.get('/stats', requireAdvancedPermissions(['notifications.view']), async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const { period = 'week' } = req.query;
    
    // Simular estadísticas
    const stats = {
      total: Math.floor(Math.random() * 1000 + 500),
      unread: Math.floor(Math.random() * 100 + 50),
      byCategory: {
        sales: Math.floor(Math.random() * 200 + 100),
        customers: Math.floor(Math.random() * 150 + 75),
        inventory: Math.floor(Math.random() * 100 + 50),
        financial: Math.floor(Math.random() * 80 + 40),
        system: Math.floor(Math.random() * 50 + 25)
      },
      period,
      companyId
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// Funciones auxiliares

function generateMockNotifications(userId, companyId, options = {}) {
  const { onlyNew = false, limit = 50, offset = 0 } = options;
  
  const types = [
    { id: 'sale_created', category: 'sales', title: 'Nueva Venta', message: 'Se registró una nueva venta por $1,250.00' },
    { id: 'customer_registered', category: 'customers', title: 'Cliente Registrado', message: 'Nuevo cliente registrado: Juan Pérez' },
    { id: 'low_stock', category: 'inventory', title: 'Stock Bajo', message: 'Producto "Laptop Dell" tiene stock bajo (5 unidades)' },
    { id: 'order_completed', category: 'sales', title: 'Orden Completada', message: 'Orden #12345 ha sido completada' },
    { id: 'payment_received', category: 'financial', title: 'Pago Recibido', message: 'Pago de $850.00 recibido de Cliente ABC' },
    { id: 'system_update', category: 'system', title: 'Actualización del Sistema', message: 'Sistema actualizado a la versión 2.1.0' },
    { id: 'user_login', category: 'system', title: 'Inicio de Sesión', message: 'Usuario María García inició sesión' },
    { id: 'invoice_generated', category: 'financial', title: 'Factura Generada', message: 'Factura #INV-001234 generada exitosamente' }
  ];
  
  const notifications = [];
  const count = Math.min(limit, 20); // Máximo 20 notificaciones de ejemplo
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const isRead = onlyNew ? false : Math.random() > 0.6;
    const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    // Si solo queremos nuevas, hacer que sean muy recientes
    if (onlyNew) {
      createdAt.setTime(Date.now() - Math.random() * 30 * 60 * 1000); // Últimos 30 minutos
    }
    
    notifications.push({
      id: `notif_${companyId}_${i}`,
      userId,
      companyId,
      type: type.id,
      category: type.category,
      title: type.title,
      message: type.message,
      data: generateMockData(type.id),
      read: isRead,
      readAt: isRead ? new Date(createdAt.getTime() + Math.random() * 60 * 60 * 1000).toISOString() : null,
      createdAt: createdAt.toISOString(),
      createdBy: 'system'
    });
  }
  
  // Ordenar por fecha de creación (más recientes primero)
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Aplicar offset si es necesario
  return notifications.slice(offset);
}

function generateMockData(typeId) {
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
  
  return dataMap[typeId] || {};
}

module.exports = router;
