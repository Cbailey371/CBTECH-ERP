const express = require('express');
const router = express.Router();
const { User, Company, AuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const { requireAuth } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');

// Middleware para auditoría automática
const auditLogger = (action, resource) => {
  return (req, res, next) => {
    // Almacenar información base para el log
    req.auditInfo = {
      action,
      resource,
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    // Capturar la respuesta original para loguear el resultado tras el envío
    const originalSend = res.send;
    res.send = function (data) {
      // Registrar evento de forma asíncrona para no bloquear la respuesta
      setImmediate(() => {
        logAuditEvent(req, res, data);
      });
      originalSend.call(this, data);
    };

    next();
  };
};

// Función para registrar eventos de auditoría en la Base de Datos
const logAuditEvent = async (req, res, responseData) => {
  try {
    const { user, companyContext: ctx, auditInfo } = req;

    // Si no hay usuario (ej. error en auth) o contexto, intentamos loguear igual si hay info
    if (!auditInfo) return;

    let responseParsed = null;
    try {
      responseParsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    } catch (e) {
      // No es JSON, ignorar cuerpo
    }

    const auditEntry = {
      userId: user ? user.id : null,
      companyId: ctx ? ctx.companyId : (req.companyId || null),
      action: auditInfo.action,
      entityType: auditInfo.resource,
      entityId: responseParsed?.data?.id || responseParsed?.id || null,
      oldData: req.method !== 'GET' ? sanitizeRequestBody(req.body) : null,
      newData: (res.statusCode >= 200 && res.statusCode < 300) ? responseParsed : null,
      ipAddress: auditInfo.ip,
      userAgent: auditInfo.userAgent,
      status: (res.statusCode >= 200 && res.statusCode < 300) ? 'SUCCESS' : 'FAILURE',
      metadata: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode
      }
    };

    // GUARDADO REAL EN BD [VULN-002 Correction]
    await AuditLog.create(auditEntry);

  } catch (error) {
    console.error('CRITICAL: Failed to save audit log:', error);
  }
};

// Sanitizar datos sensibles del request body
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'credit_card'];
  const sanitized = JSON.parse(JSON.stringify(body)); // Deep copy simple

  const redact = (obj) => {
    Object.keys(obj).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redact(obj[key]);
      }
    });
  };

  redact(sanitized);
  return sanitized;
};

// Middleware para todas las rutas de lectura de auditoría
router.use(requireAuth);
router.use(companyContext);
router.use(requireCompanyContext);

// Obtener logs de auditoría REALES
router.get('/', async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      userId,
      action,
      status
    } = req.query;

    const where = { companyId };

    if (startDate && endDate) {
      where.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (userId) where.userId = userId;
    if (action) where.action = { [Op.iLike]: `%${action}%` };
    if (status) where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }]
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo logs de auditoría reales:', error);
    res.status(500).json({ success: false, message: 'Error al obtener logs de auditoría' });
  }
});

// Obtener estadísticas de auditoría REALES
router.get('/stats', async (req, res) => {
  try {
    const { companyId } = req.companyContext;

    const total = await AuditLog.count({ where: { companyId } });
    const success = await AuditLog.count({ where: { companyId, status: 'SUCCESS' } });
    const failure = await AuditLog.count({ where: { companyId, status: 'FAILURE' } });

    const topActions = await AuditLog.findAll({
      attributes: ['action', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { companyId },
      group: ['action'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        totalEvents: total,
        successfulEvents: success,
        failedEvents: failure,
        topActions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas reales' });
  }
});

// Obtener detalles de un evento específico
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { companyId } = req.companyContext;

    const event = await AuditLog.findOne({
      where: { id: eventId, companyId },
      include: [{ model: User, as: 'user', attributes: ['username', 'email'] }]
    });

    if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener detalles del evento' });
  }
});

module.exports = {
  router,
  auditLogger,
  logAuditEvent
};
