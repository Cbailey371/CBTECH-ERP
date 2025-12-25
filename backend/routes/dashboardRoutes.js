const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');
const { requireAdvancedPermissions, hasPermission } = require('../middleware/advancedPermissions');

// Middleware para todas las rutas del dashboard
router.use(requireAuth);
router.use(companyContext);
router.use(requireCompanyContext);

// Obtener métricas principales del dashboard
router.get('/metrics', requireAdvancedPermissions(['dashboard.view']), async (req, res) => {
  try {
    const companyId = parseInt(req.companyContext.companyId, 10);
    const { period = 'month' } = req.query;

    // Aquí irían las consultas reales a la base de datos
    // Por ahora usamos datos de ejemplo

    const currentDate = new Date();
    const startDate = getStartDate(period);

    // Simular consultas a la base de datos
    const metrics = await generateMockMetrics(companyId, startDate, currentDate);

    res.json({
      success: true,
      data: metrics,
      period,
      generatedAt: currentDate.toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener actividad reciente
router.get('/activity', requireAdvancedPermissions(['dashboard.view']), async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const { limit = 10 } = req.query;

    // Simular actividad reciente
    const activities = await generateMockActivity(companyId, parseInt(limit));

    res.json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad reciente'
    });
  }
});

// Obtener datos para reportes rápidos
router.get('/reports', requireAdvancedPermissions(['reports.view']), async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const { role, permissions = {} } = req.companyContext;
    const canSee = (permission) => {
      if (req.userPermissions?.hasPermission) {
        return req.userPermissions.hasPermission(permission);
      }
      return hasPermission(role, permissions, permission);
    };

    const reports = {
      sales: {
        available: canSee('reports.sales'),
        data: canSee('reports.sales') ? {
          totalSales: 125400,
          topProducts: ['Laptop Dell', 'Mouse Logitech', 'Teclado HP'],
          salesByMonth: [10000, 15000, 12000, 8000]
        } : null
      },
      inventory: {
        available: canSee('reports.inventory'),
        data: canSee('reports.inventory') ? {
          totalProducts: 342,
          lowStockItems: 23,
          outOfStockItems: 5,
          topMovingProducts: ['Mouse Logitech', 'Laptop Dell', 'Monitor Samsung']
        } : null
      },
      customers: {
        available: canSee('reports.customers'),
        data: canSee('reports.customers') ? {
          totalCustomers: 1247,
          newCustomers: 45,
          topCustomers: ['Cliente ABC', 'Empresa XYZ', 'Juan Pérez'],
          customersByRegion: { 'Ciudad': 800, 'Interior': 447 }
        } : null
      },
      financial: {
        available: canSee('reports.financial'),
        data: canSee('reports.financial') ? {
          revenue: 125400,
          expenses: 89200,
          profit: 36200,
          profitMargin: 28.9
        } : null
      }
    };

    res.json({
      success: true,
      data: reports
    });

  } catch (error) {
    console.error('Error obteniendo reportes rápidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reportes'
    });
  }
});

// Obtener KPIs específicos por módulo
router.get('/kpis/:module', async (req, res) => {
  try {
    const { module } = req.params;
    const { companyId, role, permissions = {} } = req.companyContext;

    // Verificar permisos específicos del módulo
    const requiredPermission = `${module}.view`;
    const hasModulePermission = req.userPermissions?.hasPermission
      ? req.userPermissions.hasPermission(requiredPermission)
      : hasPermission(role, permissions, requiredPermission);

    if (!hasModulePermission) {
      return res.status(403).json({
        success: false,
        message: `No tienes permisos para ver KPIs del módulo ${module}`
      });
    }

    const kpis = await getModuleKPIs(module, companyId);

    res.json({
      success: true,
      data: kpis
    });

  } catch (error) {
    console.error(`Error obteniendo KPIs del módulo ${req.params.module}:`, error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener KPIs del módulo'
    });
  }
});

// Obtener configuración personalizada del dashboard
router.get('/config', async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.companyContext;

    // Aquí irían consultas a la base de datos para obtener configuración personalizada
    const config = {
      layout: 'grid',
      widgets: ['sales', 'customers', 'products', 'orders'],
      refreshInterval: 300000, // 5 minutos
      theme: 'default',
      currency: 'PAB',
      dateFormat: 'DD/MM/YYYY',
      showTrends: true,
      showComparisons: true
    };

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Error obteniendo configuración del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
});

// Guardar configuración personalizada del dashboard
router.post('/config', async (req, res) => {
  try {
    const userId = req.user.id;
    const { companyId } = req.companyContext;
    const { config } = req.body;

    // Validar configuración
    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Configuración inválida'
      });
    }

    // Aquí iría la lógica para guardar en la base de datos
    console.log(`Guardando configuración para usuario ${userId} en empresa ${companyId}:`, config);

    res.json({
      success: true,
      message: 'Configuración guardada exitosamente'
    });

  } catch (error) {
    console.error('Error guardando configuración del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al guardar configuración'
    });
  }
});

// Obtener datos comparativos
router.get('/comparative', requireAdvancedPermissions(['dashboard.view']), async (req, res) => {
  try {
    const { companyId } = req.companyContext;
    const { currentPeriod, previousPeriod } = req.query;

    if (!currentPeriod || !previousPeriod) {
      return res.status(400).json({
        success: false,
        message: 'Períodos requeridos para comparación'
      });
    }

    const currentData = await generateMockMetrics(companyId, new Date(currentPeriod), new Date());
    const previousData = await generateMockMetrics(companyId, new Date(previousPeriod), new Date(currentPeriod));

    const comparison = {
      current: currentData,
      previous: previousData,
      changes: {
        sales: ((currentData.sales.total - previousData.sales.total) / previousData.sales.total * 100).toFixed(2),
        customers: ((currentData.customers.total - previousData.customers.total) / previousData.customers.total * 100).toFixed(2),
        products: ((currentData.products.total - previousData.products.total) / previousData.products.total * 100).toFixed(2),
        orders: ((currentData.orders.completed - previousData.orders.completed) / previousData.orders.completed * 100).toFixed(2)
      }
    };

    res.json({
      success: true,
      data: comparison
    });

  } catch (error) {
    console.error('Error obteniendo datos comparativos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comparativa'
    });
  }
});

// Funciones auxiliares

function getStartDate(period) {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return startDate;
}

// Helper to get real metrics
async function generateRealMetrics(companyId, startDate, endDate) {
  const { Op } = require('sequelize');
  const Project = require('../models/Project');
  const Contract = require('../models/Contract');
  const Customer = require('../models/Customer');
  const Quotation = require('../models/Quotation'); // Assuming it exists

  // Customers
  console.log('Fetching metrics for Company:', companyId);
  const totalCustomers = await Customer.count({ where: { companyId, isActive: true } });
  console.log('Total Customers:', totalCustomers);

  const newCustomers = await Customer.count({
    where: {
      companyId,
      created_at: { [Op.gte]: startDate }
    }
  });

  // Projects
  const activeProjects = await Project.count({
    where: {
      companyId,
      status: ['planning', 'in_progress']
    }
  });
  console.log('Active Projects:', activeProjects);

  // Contracts
  const activeContracts = await Contract.count({
    where: {
      companyId,
      status: 'active'
    }
  });

  const upcomingExpiryDate = new Date();
  upcomingExpiryDate.setDate(upcomingExpiryDate.getDate() + 30);

  const expiringContracts = await Contract.count({
    where: {
      companyId,
      status: 'active',
      endDate: {
        [Op.between]: [new Date(), upcomingExpiryDate]
      }
    }
  });

  // Sales (Accepted Quotations Income)
  const acceptedQuotesCount = await Quotation.count({
    where: {
      companyId,
      status: 'accepted',
      date: { [Op.gte]: startDate }
    }
  });

  const acceptedQuotesValue = await Quotation.sum('total', {
    where: {
      companyId,
      status: 'accepted',
      date: { [Op.gte]: startDate }
    }
  }) || 0;

  // Active (Draft/Sent) for operational view
  const activeQuotesCounts = await Quotation.count({
    where: {
      companyId,
      status: ['draft', 'sent']
    }
  });

  const activeQuotesDraftValue = await Quotation.sum('total', {
    where: {
      companyId,
      status: ['draft', 'sent']
    }
  }) || 0;

  return {
    sales: {
      total: parseFloat(acceptedQuotesValue.toFixed(2)),
      trend: 0, // Placeholder for trend calculation
      activeQuotes: activeQuotesCounts,
      activeQuotesValue: activeQuotesDraftValue,
      acceptedQuotes: acceptedQuotesCount,
      period: 'Este periodo',
      currency: 'USD' // Changed to USD as per screenshot symbols, or use 'PAB'
    },
    customers: {
      total: totalCustomers,
      newThisMonth: newCustomers,
      trend: 0, // Calculate if needed
      loading: false
    },
    projects: {
      active: activeProjects,
      trend: 0
    },
    contracts: {
      active: activeContracts,
      expiringSoon: expiringContracts
    },
    // Keep legacy structure for compatibility if needed
    products: {
      total: 100, // Placeholder
      trend: 0
    },
    orders: {
      pending: 0,
      completed: 0
    },
    financial: {
      revenue: 0,
      expenses: 0
    }
  };
}

async function generateMockMetrics(companyId, startDate, endDate) {
  // Redirect to real metrics
  return generateRealMetrics(companyId, startDate, endDate);
}

async function generateMockActivity(companyId, limit) {
  const activities = [
    { type: 'sale', message: 'Nueva venta registrada', amount: 1250, time: new Date(Date.now() - 2 * 60000) },
    { type: 'customer', message: 'Cliente registrado: Juan Pérez', time: new Date(Date.now() - 15 * 60000) },
    { type: 'inventory', message: 'Producto con stock bajo: Laptop Dell', time: new Date(Date.now() - 60 * 60000) },
    { type: 'order', message: 'Orden completada #12345', orderId: '12345', time: new Date(Date.now() - 2 * 60 * 60000) },
    { type: 'payment', message: 'Pago recibido', amount: 850, time: new Date(Date.now() - 3 * 60 * 60000) },
    { type: 'product', message: 'Nuevo producto agregado: Mouse Logitech', time: new Date(Date.now() - 4 * 60 * 60000) },
    { type: 'user', message: 'Nuevo usuario agregado al sistema', time: new Date(Date.now() - 5 * 60 * 60000) },
    { type: 'report', message: 'Reporte mensual generado', time: new Date(Date.now() - 6 * 60 * 60000) }
  ];

  return activities
    .sort(() => Math.random() - 0.5)
    .slice(0, limit)
    .sort((a, b) => b.time - a.time);
}

async function getModuleKPIs(module, companyId) {
  const kpiMap = {
    sales: {
      totalRevenue: Math.floor(Math.random() * 100000 + 50000),
      averageOrderValue: Math.floor(Math.random() * 500 + 200),
      conversionRate: (Math.random() * 10 + 5).toFixed(2),
      salesGrowth: (Math.random() * 20 + 5).toFixed(2)
    },
    customers: {
      totalCustomers: Math.floor(Math.random() * 2000 + 1000),
      customerRetention: (Math.random() * 30 + 70).toFixed(2),
      newCustomers: Math.floor(Math.random() * 100 + 50),
      customerLifetimeValue: Math.floor(Math.random() * 5000 + 2000)
    },
    products: {
      totalProducts: Math.floor(Math.random() * 500 + 200),
      stockTurnover: (Math.random() * 10 + 2).toFixed(2),
      lowStockAlerts: Math.floor(Math.random() * 30 + 10),
      productPerformance: (Math.random() * 20 + 80).toFixed(2)
    },
    purchases: {
      totalPurchases: Math.floor(Math.random() * 80000 + 30000),
      averagePurchaseValue: Math.floor(Math.random() * 800 + 300),
      supplierPerformance: (Math.random() * 20 + 80).toFixed(2),
      costSavings: (Math.random() * 15 + 5).toFixed(2)
    }
  };

  return kpiMap[module] || {};
}

module.exports = router;
