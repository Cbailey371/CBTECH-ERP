const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize, Quotation, QuotationItem, Customer, QuotationHistory, User, Product } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const {
  companyContext,
  requireCompanyContext,
  requireCompanyPermission,
  getCompanyFilter
} = require('../middleware/companyContext');

router.use(authenticateToken);
router.use(companyContext);

// GET /api/quotations - Listado con Ganancia Calculada
router.get('/', requireCompanyContext, requireCompanyPermission(['quotations.read'], 'user'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = { ...getCompanyFilter(req) };

    if (search) {
      whereClause[Op.or] = [
        { number: { [Op.iLike]: `%${search}%` } },
        { '$customer.name$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (startDate && endDate) {
      whereClause.date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      whereClause.date = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.date = { [Op.lte]: endDate };
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows: quotations } = await Quotation.findAndCountAll({
      where: whereClause,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name']
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const quotationIds = quotations.map(q => q.id);
    const items = await QuotationItem.findAll({
      where: { quotationId: { [Op.in]: quotationIds } },
      attributes: ['quotationId', 'productId', 'quantity', 'unitPrice', 'unitCost', 'total'],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'cost']
      }]
    });

    const results = quotations.map(q => {
      const qJson = q.toJSON();
      const qItems = items.filter(item => item.quotationId === q.id);
      
      // Cálculo de Ganancia Real en el Servidor
      const totalCost = qItems.reduce((acc, item) => {
        const cost = parseFloat(item.unitCost || item.product?.cost || 0);
        return acc + (parseFloat(item.quantity) * cost);
      }, 0);

      const subtotalNet = parseFloat(q.subtotal || 0);
      const discount = parseFloat(q.discount || 0);
      
      // Ganancia = (Subtotal - Descuento Global) - Costo Total de Productos
      qJson.profit = (subtotalNet - discount) - totalCost;
      qJson.items = qItems;
      
      return qJson;
    });

    res.json({
      success: true,
      quotations: results,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error interno', detail: error.message });
  }
});

// GET /api/quotations/:id
router.get('/:id', requireCompanyContext, requireCompanyPermission(['quotations.read'], 'user'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      where: { id: req.params.id, ...getCompanyFilter(req) },
      include: [
        { model: Customer, as: 'customer' },
        { model: QuotationItem, as: 'items', include: ['product'] }
      ]
    });
    res.json({ success: true, quotation });
  } catch (e) { res.status(500).json({ success: false }); }
});

// POST /api/quotations
router.post('/', requireCompanyContext, requireCompanyPermission(['quotations.create'], 'user'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const data = req.body;
    const count = await Quotation.count({ where: getCompanyFilter(req) });
    const number = `COT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const quotation = await Quotation.create({
      ...data,
      companyId: req.companyContext.companyId,
      number,
      createdBy: req.user.id,
      status: 'draft'
    }, { transaction: t });

    if (data.items) {
      const productIds = data.items.map(i => i.productId).filter(id => id);
      const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
      const costs = products.reduce((acc, p) => { acc[p.id] = p.cost; return acc; }, {});

      await QuotationItem.bulkCreate(data.items.map((item, i) => ({
        ...item,
        quotationId: quotation.id,
        unitCost: item.productId ? (costs[item.productId] || 0) : 0,
        position: i
      })), { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, quotation });
  } catch (e) { 
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: e.message }); 
  }
});

// PUT /api/quotations/:id
router.put('/:id', requireCompanyContext, requireCompanyPermission(['quotations.update'], 'user'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const q = await Quotation.findOne({ where: { id: req.params.id, ...getCompanyFilter(req) } });
    if (!q) return res.status(404).json({ success: false });

    const snap = await Quotation.findByPk(q.id, { include: ['items'], transaction: t });
    const version = (await QuotationHistory.max('version', { where: { quotationId: q.id }, transaction: t }) || 0) + 1;
    await QuotationHistory.create({ quotationId: q.id, version, changedBy: req.user.id, data: snap.toJSON() }, { transaction: t });

    await q.update(req.body, { transaction: t });

    if (req.body.items) {
      await QuotationItem.destroy({ where: { quotationId: q.id }, transaction: t });
      const productIds = req.body.items.map(i => i.productId).filter(id => id);
      const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
      const costs = products.reduce((acc, p) => { acc[p.id] = p.cost; return acc; }, {});

      await QuotationItem.bulkCreate(req.body.items.map((item, i) => ({
        ...item,
        quotationId: q.id,
        unitCost: item.productId ? (costs[item.productId] || 0) : 0,
        position: i
      })), { transaction: t });
    }

    await t.commit();
    res.json({ success: true });
  } catch (e) {
    if (t) await t.rollback();
    res.status(500).json({ success: false, error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  const q = await Quotation.findOne({ where: { id: req.params.id, ...getCompanyFilter(req) } });
  if (q) await q.destroy();
  res.json({ success: true });
});

router.get('/:id/history', async (req, res) => {
  const history = await QuotationHistory.findAll({
    where: { quotationId: req.params.id },
    include: [{ model: User, as: 'editor', attributes: ['firstName', 'lastName'] }],
    order: [['version', 'DESC']]
  });
  res.json({ success: true, history });
});

module.exports = router;
