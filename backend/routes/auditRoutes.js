const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');
const { requireAdvancedPermissions } = require('../middleware/advancedPermissions');

// Middleware para auditoría automática
const auditLogger = (action, resource) => {
  return (req, res, next) => {
    // Almacenar información para el log de auditoría
    req.auditInfo = {
      action,
      resource,
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    // Capturar la respuesta original
    const originalSend = res.send;
    res.send = function(data) {
      // Log de auditoría después de la respuesta
      setImmediate(() => {
        logAuditEvent(req, res, data);
      });
      
      // Llamar al método original
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Función para registrar eventos de auditoría
const logAuditEvent = async (req, res, responseData) => {
  try {
    const { user, companyContext: ctx, auditInfo, userPermissions } = req;
    
    if (!user || !ctx) return;
    
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.username,
      userEmail: user.email,
      companyId: ctx.companyId,
      companyName: ctx.company?.name,
      action: auditInfo.action,
      resource: auditInfo.resource,
      method: req.method,
      endpoint: req.originalUrl,
      statusCode: res.statusCode,
      ip: auditInfo.ip,
      userAgent: auditInfo.userAgent,
      timestamp: auditInfo.timestamp,
      requestBody: sanitizeRequestBody(req.body),
      responseSuccess: res.statusCode >= 200 && res.statusCode < 300,
      details: generateAuditDetails(req, res, responseData, userPermissions, ctx)
    };
    
    // Aquí se guardaría en la base de datos
    console.log('Audit Log:', JSON.stringify(auditEntry, null, 2));
    
    // En una implementación real, guardar en base de datos:
    // await AuditLog.create(auditEntry);
    
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
};

// Sanitizar datos sensibles del request body
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
  const sanitized = { ...body };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Generar detalles específicos del evento
const generateAuditDetails = (req, res, responseData, userPermissions, companyContext) => {
  const effectivePermissions = userPermissions?.getAllPermissions
    ? userPermissions.getAllPermissions()
    : Object.entries(companyContext?.permissions || {})
        .filter(([, granted]) => granted === true)
        .map(([permission]) => permission);

  const details = {
    requestId: req.headers['x-request-id'] || 'unknown',
    sessionId: req.session?.id || 'unknown',
    permissions: effectivePermissions,
    role: companyContext?.role || 'unknown'
  };
  
  // Agregar detalles específicos según el endpoint
  if (req.originalUrl.includes('/customers')) {
    details.module = 'customers';
  } else if (req.originalUrl.includes('/products')) {
    details.module = 'products';
  } else if (req.originalUrl.includes('/sales')) {
    details.module = 'sales';
  } else if (req.originalUrl.includes('/dashboard')) {
    details.module = 'dashboard';
  }
  
  return details;
};

// Middleware para todas las rutas de auditoría
router.use(requireAuth);
router.use(companyContext);
router.use(requireCompanyContext);

// Obtener logs de auditoría
router.get('/', requireAdvancedPermissions(['audit.view']), async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const { 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      userId, 
      action, 
      resource,
      success 
    } = req.query;
    
    // Construir filtros
    const filters = { companyId };
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (success !== undefined) filters.success = success === 'true';
    
    // Simular consulta a base de datos
    const auditLogs = await generateMockAuditLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: {
        logs: auditLogs.logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: auditLogs.total,
          totalPages: Math.ceil(auditLogs.total / parseInt(limit))
        },
        filters
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs de auditoría'
    });
  }
});

// Obtener estadísticas de auditoría
router.get('/stats', requireAdvancedPermissions(['audit.view']), async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const { period = 'week' } = req.query;
    
    // Simular estadísticas
    const stats = {
      totalEvents: Math.floor(Math.random() * 10000 + 5000),
      successfulEvents: Math.floor(Math.random() * 8000 + 4000),
      failedEvents: Math.floor(Math.random() * 2000 + 1000),
      uniqueUsers: Math.floor(Math.random() * 50 + 20),
      topActions: [
        { action: 'view', count: Math.floor(Math.random() * 3000 + 1500) },
        { action: 'create', count: Math.floor(Math.random() * 1000 + 500) },
        { action: 'update', count: Math.floor(Math.random() * 800 + 400) },
        { action: 'delete', count: Math.floor(Math.random() * 200 + 100) }
      ],
      topResources: [
        { resource: 'customers', count: Math.floor(Math.random() * 2000 + 1000) },
        { resource: 'products', count: Math.floor(Math.random() * 1500 + 750) },
        { resource: 'sales', count: Math.floor(Math.random() * 1200 + 600) },
        { resource: 'dashboard', count: Math.floor(Math.random() * 800 + 400) }
      ],
      period,
      companyId
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error obteniendo estadísticas de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

// Obtener actividad de un usuario específico
router.get('/user/:userId', requireAdvancedPermissions(['audit.view']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { companyId } = req.companyContext;
    const { limit = 20 } = req.query;
    
    // Verificar que el usuario pertenece a la empresa
    // En una implementación real, verificar en la base de datos
    
    const userActivity = await generateMockUserActivity(userId, companyId, parseInt(limit));
    
    res.json({
      success: true,
      data: userActivity
    });
    
  } catch (error) {
    console.error('Error obteniendo actividad del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad del usuario'
    });
  }
});

// Exportar reporte de auditoría
router.get('/export', requireAdvancedPermissions(['audit.export']), async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const { format = 'csv', startDate, endDate } = req.query;
    
    // Validar formato
    if (!['csv', 'json', 'xlsx'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Formato no soportado. Use csv, json o xlsx'
      });
    }
    
    // Simular generación de reporte
    const reportData = await generateAuditReport(companyId, { startDate, endDate, format });
    
    res.json({
      success: true,
      data: {
        downloadUrl: `/api/audit/download/${reportData.id}`,
        filename: reportData.filename,
        size: reportData.size,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error exportando reporte de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte'
    });
  }
});

// Obtener detalles de un evento específico
router.get('/event/:eventId', requireAdvancedPermissions(['audit.view']), async (req, res) => {
  try {
    const { eventId } = req.params;
    const { companyId } = req.companyContext;
    
    // Simular búsqueda de evento específico
    const event = {
      id: eventId,
      userId: 'user123',
      userName: 'Juan Pérez',
      userEmail: 'juan@empresa.com',
      companyId,
      action: 'update',
      resource: 'customer',
      method: 'PUT',
      endpoint: '/api/customers/123',
      statusCode: 200,
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date().toISOString(),
      requestBody: { name: 'Cliente Actualizado', email: 'nuevo@email.com' },
      responseSuccess: true,
      details: {
        module: 'customers',
        customerId: '123',
        changedFields: ['name', 'email'],
        previousValues: { name: 'Cliente Anterior', email: 'anterior@email.com' }
      }
    };
    
    res.json({
      success: true,
      data: event
    });
    
  } catch (error) {
    console.error('Error obteniendo detalles del evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del evento'
    });
  }
});

// Funciones auxiliares

async function generateMockAuditLogs(filters, pagination) {
  const actions = ['view', 'create', 'update', 'delete', 'export', 'login', 'logout'];
  const resources = ['customers', 'products', 'sales', 'dashboard', 'users', 'reports'];
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  
  const logs = [];
  const total = Math.floor(Math.random() * 1000 + 500);
  
  for (let i = 0; i < Math.min(pagination.limit, 50); i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const resource = resources[Math.floor(Math.random() * resources.length)];
    const method = methods[Math.floor(Math.random() * methods.length)];
    const success = Math.random() > 0.1; // 90% éxito
    
    logs.push({
      id: `audit_${Date.now()}_${i}`,
      userId: `user_${Math.floor(Math.random() * 10) + 1}`,
      userName: `Usuario ${Math.floor(Math.random() * 10) + 1}`,
      userEmail: `user${Math.floor(Math.random() * 10) + 1}@empresa.com`,
      companyId: filters.companyId,
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
        sessionId: `sess_${Math.floor(Math.random() * 1000)}`
      }
    });
  }
  
  return {
    logs: logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    total
  };
}

async function generateMockUserActivity(userId, companyId, limit) {
  const activities = [];
  
  for (let i = 0; i < limit; i++) {
    activities.push({
      id: `activity_${userId}_${i}`,
      action: ['login', 'view_dashboard', 'create_customer', 'update_product', 'generate_report'][Math.floor(Math.random() * 5)],
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      success: Math.random() > 0.05,
      details: {
        endpoint: '/api/dashboard',
        duration: Math.floor(Math.random() * 1000) + 100
      }
    });
  }
  
  return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

async function generateAuditReport(companyId, options) {
  return {
    id: `report_${Date.now()}`,
    filename: `audit_report_${companyId}_${new Date().toISOString().split('T')[0]}.${options.format}`,
    size: Math.floor(Math.random() * 1000000) + 100000, // Simular tamaño en bytes
    format: options.format,
    recordCount: Math.floor(Math.random() * 10000) + 1000
  };
}

// Exportar middleware de auditoría
module.exports = {
  router,
  auditLogger,
  logAuditEvent
};
