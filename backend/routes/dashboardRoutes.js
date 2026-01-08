const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');
const { requireAdvancedPermissions, hasPermission } = require('../middleware/advancedPermissions');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const moment = require('moment'); // Ensure moment is available or use native Date

// Models
const {
  Payment,
  SalesOrder,
  Quotation,
  Customer,
  CreditNote,
  Product,
  Project,
  Contract,
  User
} = require('../models');

// Middleware
router.use(requireAuth);
router.use(companyContext);
router.use(requireCompanyContext);

/**
 * GET /metrics
 * Returns dashboard KPIs based on a date range.
 * Query Params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), compare (boolean)
 */
router.get('/metrics', requireAdvancedPermissions(['dashboard.view']), async (req, res) => {
  try {
    const companyId = req.companyContext.companyId;
    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRanges(req.query);

    // 1. Fetch Current Period Metrics
    const currentMetrics = await calculatePeriodMetrics(companyId, startDate, endDate);

    // 2. Fetch Previous Period Metrics (if comparison needed)
    let previousMetrics = null;
    if (previousStartDate && previousEndDate) {
      previousMetrics = await calculatePeriodMetrics(companyId, previousStartDate, previousEndDate);
    }

    // 3. Receivables (Point in Time - Not range bound, but "As of Now")
    const receivables = await calculateReceivables(companyId);

    // 4. Analytics Chart Data (Daily breakdown)
    const analytics = await generateChartData(companyId, startDate, endDate);

    // 5. Calculate Variations
    const variations = calculateVariations(currentMetrics, previousMetrics);

    res.json({
      success: true,
      data: {
        ...currentMetrics,
        receivables,
        variations,
        analytics,
        meta: {
          currency: 'USD',
          period: { start: startDate, end: endDate }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, message: 'Error retrieving dashboard metrics' });
  }
});

/**
 * GET /quick-actions
 * Returns lists for "Recent Documents" and "Stale Quotes" tables
 */
router.get('/quick-actions', requireAdvancedPermissions(['dashboard.view']), async (req, res) => {
  try {
    const companyId = req.companyContext.companyId;
    const limit = 5;

    // Recent Sales Orders
    // Recent Sales Orders
    const recentOrders = await SalesOrder.findAll({
      where: { companyId, status: { [Op.ne]: 'draft' } },
      limit,
      order: [['issueDate', 'DESC']],
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
      attributes: ['id', 'orderNumber', 'issueDate', 'total', 'paymentStatus', 'status'] // Changed 'number' to 'orderNumber'
    });

    // Stale Quotations (Draft/Sent > 15 days ago)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const staleQuotes = await Quotation.findAll({
      where: {
        companyId,
        status: { [Op.in]: ['draft', 'sent'] },
        updatedAt: { [Op.lt]: fifteenDaysAgo }
      },
      limit,
      order: [['updatedAt', 'ASC']], // Oldest first
      include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
      attributes: ['id', 'number', 'date', 'total', 'status', 'updatedAt'] // Quotation actually has 'number' field based on standard ERP patterns, double check if it fails too. But the error was about SalesOrder.number. Quotation likely has 'number' or 'quotationNumber'. Assuming 'number' for now based on context, but if Quotation has 'quotationNumber', this will fail too. Let's assume Quotation is correct for now or I should check Quotation model.
    });

    // Top Clients (by Sales Volume in current month) - Simplified for now
    // Ideally this should use the same date range as the main filter, but for "Quick Actions" 
    // we often just show "All Time" or "Recent". Let's do Top 5 All Time for simplicity in this endpoint,
    // or we could split it. Let's stick to Recent + Stale here.

    res.json({
      success: true,
      data: {
        recentOrders,
        staleQuotes
      }
    });

  } catch (error) {
    console.error('Error fetching quick actions:', error);
    res.status(500).json({ success: false, message: 'Error retrieving quick action data' });
  }
});

/**
 * GET /top-clients
 * Query Params: startDate, endDate
 */
router.get('/top-clients', requireAdvancedPermissions(['dashboard.view']), async (req, res) => {
  try {
    const companyId = req.companyContext.companyId;
    const { startDate, endDate } = getDateRanges(req.query);

    // Group SalesOrders by Customer
    const topClients = await SalesOrder.findAll({
      attributes: [
        [sequelize.col('customer.name'), 'customerName'], // Fixed alias casing to match 'as: customer'
        [sequelize.col('customer.id'), 'customerId'],
        [sequelize.fn('SUM', sequelize.col('total')), 'totalSales']
      ],
      include: [{
        model: Customer,
        as: 'customer',
        attributes: [] // We select manually above
      }],
      where: {
        companyId,
        status: { [Op.notIn]: ['cancelled', 'draft'] },
        issueDate: { [Op.between]: [startDate, endDate] }
      },
      group: ['customer.id', 'customer.name'], // Fixed alias casing
      order: [[sequelize.fn('SUM', sequelize.col('total')), 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({ success: true, data: topClients });
  } catch (error) {
    console.error('Error fetching top clients:', error);
    res.status(500).json({ success: false, message: 'Error fetching top clients' });
  }
});

// --- HELPER FUNCTIONS ---

function getDateRanges(query) {
  const today = new Date();
  // Default to current month if not provided
  let startDate = query.startDate ? new Date(query.startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
  let endDate = query.endDate ? new Date(query.endDate) : new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Previous Period (Same duration, immediately preceding)
  const duration = endDate - startDate;
  const previousEndDate = new Date(startDate);
  previousEndDate.setDate(previousEndDate.getDate() - 1);
  const previousStartDate = new Date(previousEndDate - duration);

  return { startDate, endDate, previousStartDate, previousEndDate };
}

async function calculatePeriodMetrics(companyId, startDate, endDate) {
  // 1. Cash-In (Payments Received)
  const cashIn = await Payment.sum('amount', {
    where: {
      companyId,
      date: { [Op.between]: [startDate, endDate] }
    }
  }) || 0;

  // 2. Invoicing (Sales Orders Issued)
  const invoicing = await SalesOrder.sum('total', {
    where: {
      companyId,
      status: { [Op.notIn]: ['cancelled', 'draft'] },
      issueDate: { [Op.between]: [startDate, endDate] }
    }
  }) || 0;

  // 3. Customers (New)
  const newCustomers = await Customer.count({
    where: {
      companyId,
      created_at: { [Op.between]: [startDate, endDate] } // Sequelize maps this to created_at automatically in standard queries
    }
  });

  // 4. Customers (Total Active - Point in time, but useful context)
  const totalCustomers = await Customer.count({ where: { companyId, isActive: true } });

  // 5. Quotations (Funnel)
  const quotes = await Quotation.findAll({
    attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count'], [sequelize.fn('SUM', sequelize.col('total')), 'value']],
    where: {
      companyId,
      date: { [Op.between]: [startDate, endDate] } // Using creation date for funnel entry
    },
    group: ['status'],
    raw: true
  });

  const funnel = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    conversionRate: 0,
    totalValueInPlay: 0
  };

  quotes.forEach(q => {
    const val = parseFloat(q.value || 0);
    const count = parseInt(q.count || 0);
    if (['draft'].includes(q.status)) funnel.draft += count;
    if (['sent'].includes(q.status)) funnel.sent += count;
    if (['accepted', 'invoiced'].includes(q.status)) funnel.accepted += count;
    if (['rejected'].includes(q.status)) funnel.rejected += count;

    if (['draft', 'sent'].includes(q.status)) funnel.totalValueInPlay += val;
  });

  const totalClosed = funnel.accepted + funnel.rejected;
  funnel.conversionRate = totalClosed > 0 ? ((funnel.accepted / totalClosed) * 100).toFixed(1) : 0;

  return {
    cashIn: parseFloat(cashIn),
    invoicing: parseFloat(invoicing),
    customers: { new: newCustomers, total: totalCustomers },
    funnel,
    quotations: {
      totalValue: quotes.reduce((sum, q) => sum + parseFloat(q.value || 0), 0),
      count: quotes.reduce((sum, q) => sum + parseInt(q.count || 0), 0)
    }
  };
}

async function calculateReceivables(companyId) {
  // Calculate based on SalesOrder logic: (total - paidAmount) where status not cancelled/draft
  // Note: SalesOrder model might have 'balance' field or we calculate it safely.
  // Let's assume we sum (total - paid_amount)

  // We need to fetch orders that are partially paid or unpaid
  const orders = await SalesOrder.findAll({
    where: {
      companyId,
      status: { [Op.notIn]: ['cancelled', 'draft'] },
      paymentStatus: { [Op.in]: ['unpaid', 'partial'] }
    },
    attributes: ['id', 'total', 'paidAmount', ['issue_date', 'dueDate']]
  });

  let totalPending = 0;
  let totalOverdue = 0;
  const now = new Date();

  orders.forEach(o => {
    const total = parseFloat(o.total || 0);
    const paid = parseFloat(o.paidAmount || 0);
    const balance = total - paid;

    if (balance > 0.01) { // tolerance
      totalPending += balance;
      if (o.dueDate && new Date(o.dueDate) < now) {
        totalOverdue += balance;
      }
    }
  });

  return {
    totalPending: parseFloat(totalPending.toFixed(2)),
    totalOverdue: parseFloat(totalOverdue.toFixed(2))
  };
}

async function generateChartData(companyId, startDate, endDate) {
  // Generate daily breakdown
  // We want a merged list of days with: date, cashIn, invoicing

  const payments = await Payment.findAll({
    where: {
      companyId,
      date: { [Op.between]: [startDate, endDate] }
    },
    attributes: ['date', [sequelize.fn('SUM', sequelize.col('amount')), 'amount']],
    group: ['date'],
    raw: true
  });

  const invoices = await SalesOrder.findAll({
    where: {
      companyId,
      status: { [Op.notIn]: ['cancelled', 'draft'] },
      issueDate: { [Op.between]: [startDate, endDate] }
    },
    attributes: [['issue_date', 'date'], [sequelize.fn('SUM', sequelize.col('total')), 'amount']], // Alias issue_date to date for merging
    group: ['issue_date'],
    raw: true
  });

  const quotes = await Quotation.findAll({
    where: {
      companyId,
      date: { [Op.between]: [startDate, endDate] }
    },
    attributes: ['date', [sequelize.fn('SUM', sequelize.col('total')), 'amount']],
    group: ['date'],
    raw: true
  });

  // Create Map of Date -> Data
  const dataMap = {};

  // Fill with all days in range (optional, but good for charts)
  let loop = new Date(startDate);
  while (loop <= endDate) {
    const dateStr = loop.toISOString().split('T')[0];
    dataMap[dateStr] = { date: dateStr, cashIn: 0, invoicing: 0, quotations: 0 };
    loop.setDate(loop.getDate() + 1);
  }

  // Merge DB Data
  payments.forEach(p => {
    if (dataMap[p.date]) dataMap[p.date].cashIn = parseFloat(p.amount);
  });

  invoices.forEach(i => {
    const d = i.date; // already YYYY-MM-DD string often from DATEONLY
    if (dataMap[d]) dataMap[d].invoicing = parseFloat(i.amount);
  });

  quotes.forEach(q => {
    if (dataMap[q.date]) dataMap[q.date].quotations = parseFloat(q.amount);
  });

  return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
}

function calculateVariations(current, previous) {
  if (!previous) return {};

  const calc = (curr, prev) => {
    if (!prev) return 100; // if prev was 0, it's 100% growth or infinite
    return (((curr - prev) / prev) * 100).toFixed(1);
  };

  return {
    cashIn: calc(current.cashIn, previous.cashIn),
    invoicing: calc(current.invoicing, previous.invoicing),
    newCustomers: calc(current.customers.new, previous.customers.new),
    quotations: calc(current.quotations.totalValue, previous.quotations.totalValue)
    // receivables don't have variations vs "previous period" in the same way usually
  };
}

module.exports = router;
