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

// GET /api/quotations - Listado
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
      include: [{ model: Customer, as: 'customer', attributes: ['id', 'name'] }],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const quotationIds = quotations.map(q => q.id);
    const items = await QuotationItem.findAll({
      where: { quotationId: { [Op.in]: quotationIds } },
      attributes: ['quotationId', 'productId', 'quantity', 'unitPrice', 'unitCost', 'total', 'discountValue', 'discountType'],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'cost', 'type', 'margin']
      }],
      order: [['position', 'ASC']]
    });

    const results = quotations.map(q => {
      const qJson = q.toJSON();
      const qItems = items.filter(item => item.quotationId === q.id);
      
      let profitValue = 0;
      qItems.forEach(item => {
        const product = item.product;
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const discVal = parseFloat(item.discountValue) || 0;
        
        let itemLineTotal = qty * price;
        if (item.discountType === 'percentage') {
          itemLineTotal -= (itemLineTotal * (discVal / 100));
        } else {
          itemLineTotal -= discVal;
        }

        let unitCost = parseFloat(item.unitCost || (product ? product.cost : 0));
        const isService = product?.type === 'service';
        const productMargin = parseFloat(product?.margin || 0);

        if (isService && productMargin === 0) {
          unitCost = 0;
        }

        profitValue += (itemLineTotal - (unitCost * qty));
      });

      qJson.profit = profitValue;
      qJson.items = qItems;
      return qJson;
    });

    res.json({ success: true, quotations: results, pagination: { current_page: parseInt(page), total_pages: Math.ceil(count / limit), total_items: count } });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
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
      ],
      order: [
        [{ model: QuotationItem, as: 'items' }, 'position', 'ASC']
      ]
    });
    res.json({ success: true, quotation });
  } catch (e) { res.status(500).json({ success: false }); }
});

// POST
router.post('/', requireCompanyContext, requireCompanyPermission(['quotations.create'], 'user'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const data = req.body;
    const count = await Quotation.count({ where: getCompanyFilter(req) });
    const number = `COT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Obtener productos para capturar costos actuales
    const productIds = (data.items || []).map(i => i.productId).filter(id => id);
    const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
    const productMap = products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

    const quotation = await Quotation.create({ ...data, companyId: req.companyContext.companyId, number, createdBy: req.user.id, status: 'draft' }, { transaction: t });

    if (data.items) {
      await QuotationItem.bulkCreate(data.items.map((item, i) => {
        const prod = productMap[item.productId];
        let unitCost = item.productId ? (prod?.cost || 0) : 0;
        if (prod?.type === 'service' && parseFloat(prod?.margin || 0) === 0) {
          unitCost = 0;
        }
        
        // Solo extraemos los campos que pertenecen a QuotationItem
        return {
          quotationId: quotation.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: unitCost,
          taxRate: item.taxRate,
          total: item.total,
          discountType: item.discountType,
          discountValue: item.discountValue,
          position: i
        };
      }), { transaction: t });
    }

    await t.commit();
    res.status(201).json({ success: true, quotation });
  } catch (e) { if (t) await t.rollback(); res.status(500).json({ success: false, error: e.message }); }
});

// PUT
router.put('/:id', requireCompanyContext, requireCompanyPermission(['quotations.update'], 'user'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const q = await Quotation.findOne({ where: { id: req.params.id, ...getCompanyFilter(req) } });
    if (!q) return res.status(404).json({ success: false });

    // Snapshot historial con productos incluidos y ORDENADOS
    const snap = await Quotation.findByPk(q.id, { 
      include: [
        { 
          model: QuotationItem, 
          as: 'items',
          include: [{ model: Product, as: 'product' }]
        }
      ], 
      order: [
        [{ model: QuotationItem, as: 'items' }, 'position', 'ASC']
      ],
      transaction: t 
    });
    const v = (await QuotationHistory.max('version', { where: { quotationId: q.id }, transaction: t }) || 0) + 1;
    await QuotationHistory.create({ quotationId: q.id, version: v, changedBy: req.user.id, data: snap.toJSON() }, { transaction: t });

    // 1. Sanitizar los campos de la cotización (eliminar campos virtuales/relacionales)
    const { 
      id, companyId, createdAt, updatedAt, 
      customer, profit, items: bodyItems, 
      ...validQuotationData 
    } = req.body;

    await q.update(validQuotationData, { transaction: t });

    // 2. Si vienen ítems, sanitizarlos también
    if (bodyItems) {
      await QuotationItem.destroy({ where: { quotationId: q.id }, transaction: t });
      
      const productIds = bodyItems.map(i => i.productId).filter(id => id);
      const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
      const productMap = products.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

      await QuotationItem.bulkCreate(bodyItems.map((item, i) => {
        const prod = productMap[item.productId];
        let unitCost = item.productId ? (prod?.cost || 0) : 0;
        if (prod?.type === 'service' && parseFloat(prod?.margin || 0) === 0) {
          unitCost = 0;
        }
        
        return {
          quotationId: q.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: unitCost,
          taxRate: item.taxRate,
          total: item.total,
          discountType: item.discountType,
          discountValue: item.discountValue,
          position: i
        };
      }), { transaction: t });
    }

    await t.commit();
    res.json({ success: true });
  } catch (e) { if (t) await t.rollback(); res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  const q = await Quotation.findOne({ where: { id: req.params.id, ...getCompanyFilter(req) } });
  if (q) await q.destroy();
  res.json({ success: true });
});

router.get('/:id/history', async (req, res) => {
  const h = await QuotationHistory.findAll({ where: { quotationId: req.params.id }, include: [{ model: User, as: 'editor', attributes: ['firstName', 'lastName'] }], order: [['version', 'DESC']] });
  res.json({ success: true, history: h });
});

module.exports = router;
