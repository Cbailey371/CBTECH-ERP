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

// Middleware global
router.use(authenticateToken);
router.use(companyContext);

// GET /api/quotations - Listar cotizaciones
router.get('/', requireCompanyContext, requireCompanyPermission(['quotations.read'], 'user'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      ...getCompanyFilter(req)
    };

    if (search) {
      whereClause[Op.or] = [
        { number: { [Op.iLike]: `%${search}%` } },
        { '$customer.name$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = { [Op.gte]: startDate };
    } else if (endDate) {
      whereClause.date = { [Op.lte]: endDate };
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Quotation.findAndCountAll({
      where: whereClause,
      distinct: true,
      attributes: ['id', 'number', 'date', 'status', 'total', 'subtotal', 'discount', 'tax', 'retention', 'currency', 'customerId'],
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name']
        },
        {
          model: QuotationItem,
          as: 'items',
          attributes: ['quantity', 'unitPrice', 'unitCost', 'total'],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'cost']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      quotations: rows,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(count / limit),
        total_items: count,
        items_per_page: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error al listar cotizaciones:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', detail: error.message });
  }
});

// GET /api/quotations/:id - Obtener detalle
router.get('/:id', requireCompanyContext, requireCompanyPermission(['quotations.read'], 'user'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      where: {
        id: req.params.id,
        ...getCompanyFilter(req)
      },
      include: [
        {
          model: Customer,
          as: 'customer'
        },
        {
          model: QuotationItem,
          as: 'items',
          include: ['product']
        }
      ],
      order: [
        [{ model: QuotationItem, as: 'items' }, 'position', 'ASC']
      ]
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }

    res.json({ success: true, quotation });
  } catch (error) {
    console.error('Error al obtener detalle de cotización:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// POST /api/quotations - Crear cotización
router.post('/', requireCompanyContext, requireCompanyPermission(['quotations.create'], 'user'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      customerId,
      date,
      validUntil,
      notes,
      items,
      discountType = 'amount',
      discountValue = 0,
      taxRate = 0.07,
      retention = 0
    } = req.body;

    const count = await Quotation.count({ where: getCompanyFilter(req) });
    const number = `COT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let subtotalItems = 0;

    const productIds = items.map(i => i.productId).filter(id => id);
    const productsInvolved = await Product.findAll({
      where: { id: { [Op.in]: productIds } },
      attributes: ['id', 'cost']
    });
    const costMap = productsInvolved.reduce((acc, p) => {
      acc[p.id] = parseFloat(p.cost);
      return acc;
    }, {});

    const itemsToCreate = items.map(item => {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice);
      const itemDiscountValue = parseFloat(item.discountValue) || 0;
      const itemDiscountType = item.discountType || 'amount';
      const itemUnitCost = item.productId ? (costMap[item.productId] || 0) : 0;

      let itemTotalBeforeDiscount = qty * price;
      let itemDiscountAmount = (itemDiscountType === 'percentage') 
        ? itemTotalBeforeDiscount * (itemDiscountValue / 100) 
        : itemDiscountValue;

      const itemTotal = itemTotalBeforeDiscount - itemDiscountAmount;
      subtotalItems += itemTotal;

      return {
        ...item,
        unitCost: itemUnitCost,
        discount: itemDiscountAmount,
        discountType: itemDiscountType,
        discountValue: itemDiscountValue,
        total: itemTotal
      };
    });

    let globalDiscountAmount = (discountType === 'percentage') 
      ? subtotalItems * (parseFloat(discountValue) / 100) 
      : parseFloat(discountValue);

    const taxable = Math.max(0, subtotalItems - globalDiscountAmount);
    const effectiveTaxRate = parseFloat(taxRate);
    const tax = taxable * effectiveTaxRate;
    const total = taxable + tax - parseFloat(retention || 0);

    const quotation = await Quotation.create({
      companyId: req.companyContext.companyId,
      customerId,
      number,
      date,
      validUntil,
      status: 'draft',
      subtotal: subtotalItems,
      discount: globalDiscountAmount,
      discountType,
      discountValue,
      tax,
      taxRate: effectiveTaxRate,
      retention,
      total,
      notes,
      createdBy: req.user.id
    }, { transaction: t });

    if (itemsToCreate.length > 0) {
      await QuotationItem.bulkCreate(
        itemsToCreate.map((item, index) => ({
          quotationId: quotation.id,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          discount: item.discount,
          discountType: item.discountType,
          discountValue: item.discountValue,
          position: item.position !== undefined ? item.position : index,
          total: item.total
        })),
        { transaction: t }
      );
    }

    await t.commit();
    res.status(201).json({ success: true, quotation });

  } catch (error) {
    if (t && !t.finished) await t.rollback();
    console.error('Error al crear:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
});

// PUT /api/quotations/:id - Actualizar cotización
router.put('/:id', requireCompanyContext, requireCompanyPermission(['quotations.update'], 'user'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      customerId, date, validUntil, notes, items,
      discountType = 'amount', discountValue = 0,
      taxRate = 0.07, status, retention
    } = req.body;

    const quotation = await Quotation.findOne({ where: { id, ...getCompanyFilter(req) } });
    if (!quotation) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'No encontrada' });
    }

    // Snapshot historial
    const currentSnapshot = await Quotation.findByPk(id, { include: [{ model: QuotationItem, as: 'items' }], transaction: t });
    await QuotationHistory.create({
      quotationId: id,
      version: ((await QuotationHistory.max('version', { where: { quotationId: id }, transaction: t })) || 0) + 1,
      changedBy: req.user.id,
      data: currentSnapshot.toJSON()
    }, { transaction: t });

    let updateData = {};
    if (items) {
      let subtotalItems = 0;
      const productIds = items.map(i => i.productId).filter(id => id);
      const productsInvolved = await Product.findAll({ where: { id: { [Op.in]: productIds } }, attributes: ['id', 'cost'] });
      const costMap = productsInvolved.reduce((acc, p) => { acc[p.id] = parseFloat(p.cost); return acc; }, {});

      const itemsToCreate = items.map(item => {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        const dVal = parseFloat(item.discountValue || 0);
        const dType = item.discountType || 'amount';
        const cost = item.productId ? (costMap[item.productId] || 0) : 0;
        const sub = qty * price;
        const dAmount = (dType === 'percentage') ? sub * (dVal / 100) : dVal;
        subtotalItems += (sub - dAmount);
        return { ...item, unitCost: cost, discount: dAmount, total: sub - dAmount };
      });

      let globalD = (discountType === 'percentage') ? subtotalItems * (parseFloat(discountValue) / 100) : parseFloat(discountValue);
      let tax = (subtotalItems - globalD) * parseFloat(taxRate);
      let ret = parseFloat(retention !== undefined ? retention : quotation.retention);

      updateData = {
        subtotal: subtotalItems, discount: globalD, discountType, discountValue,
        tax, taxRate: parseFloat(taxRate), retention: ret, total: (subtotalItems - globalD) + tax - ret,
        notes, date, validUntil
      };

      await QuotationItem.destroy({ where: { quotationId: id }, transaction: t });
      await QuotationItem.bulkCreate(itemsToCreate.map((item, index) => ({
        quotationId: id, productId: item.productId || null, description: item.description,
        quantity: item.quantity, unitPrice: item.unitPrice, unitCost: item.unitCost,
        discount: item.discount, discountType: item.discountType, discountValue: item.discountValue,
        position: item.position !== undefined ? item.position : index, total: item.total
      })), { transaction: t });
    } else {
      if (date) updateData.date = date;
      if (validUntil) updateData.validUntil = validUntil;
      if (notes !== undefined) updateData.notes = notes;
    }

    if (customerId) updateData.customerId = customerId;
    if (status) updateData.status = status;

    await quotation.update(updateData, { transaction: t });
    await t.commit();
    res.json({ success: true, message: 'Actualizada' });
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    console.error(error);
    res.status(500).json({ success: false, message: 'Error' });
  }
});

// DELETE
router.delete('/:id', requireCompanyContext, requireCompanyPermission(['quotations.delete'], 'manager'), async (req, res) => {
  try {
    const q = await Quotation.findOne({ where: { id: req.params.id, ...getCompanyFilter(req) } });
    if (q) await q.destroy();
    res.json({ success: true });
  } catch (error) { res.status(500).json({ success: false }); }
});

// HISTORY
router.get('/:id/history', requireCompanyContext, requireCompanyPermission(['quotations.read'], 'user'), async (req, res) => {
  try {
    const history = await QuotationHistory.findAll({
      where: { quotationId: req.params.id },
      include: [{ model: User, as: 'editor', attributes: ['firstName', 'lastName'] }],
      order: [['version', 'DESC']]
    });
    res.json({ success: true, history });
  } catch (error) { res.status(500).json({ success: false }); }
});

module.exports = router;
