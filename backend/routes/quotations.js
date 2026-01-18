const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize, Quotation, QuotationItem, Customer } = require('../models');
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
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['id', 'name', 'email']
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
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
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
      ]
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }

    res.json({ success: true, quotation });

  } catch (error) {
    console.error('Error al obtener cotización:', error);
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
      taxRate = 0.07 // Default 7%
    } = req.body;

    // Generar número secuencial (simple por ahora)
    const count = await Quotation.count({ where: getCompanyFilter(req) });
    const number = `COT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calcular totales
    let subtotalItems = 0;

    const itemsToCreate = items.map(item => {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.unitPrice);
      const itemDiscountValue = parseFloat(item.discountValue) || 0;
      const itemDiscountType = item.discountType || 'amount';

      let itemTotalBeforeDiscount = qty * price;
      let itemDiscountAmount = 0;

      if (itemDiscountType === 'percentage') {
        itemDiscountAmount = itemTotalBeforeDiscount * (itemDiscountValue / 100);
      } else {
        itemDiscountAmount = itemDiscountValue;
      }

      const itemTotal = itemTotalBeforeDiscount - itemDiscountAmount;
      subtotalItems += itemTotal;

      return {
        ...item,
        discount: itemDiscountAmount, // Guardamos el monto del descuento calculado
        discountType: itemDiscountType,
        discountValue: itemDiscountValue,
        total: itemTotal
      };
    });

    // Calcular descuento global
    let globalDiscountAmount = 0;
    const globalDiscountVal = parseFloat(discountValue) || 0;

    if (discountType === 'percentage') {
      globalDiscountAmount = subtotalItems * (globalDiscountVal / 100);
    } else {
      globalDiscountAmount = globalDiscountVal;
    }

    const taxable = Math.max(0, subtotalItems - globalDiscountAmount);
    const effectiveTaxRate = parseFloat(taxRate);
    const tax = taxable * effectiveTaxRate;
    const total = taxable + tax;

    // Crear cabecera
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
      discountValue: globalDiscountVal,
      tax,
      taxRate: effectiveTaxRate,
      total,
      notes,
      createdBy: req.user.id
    }, { transaction: t });

    // Crear items
    if (itemsToCreate.length > 0) {
      await QuotationItem.bulkCreate(
        itemsToCreate.map(item => ({
          quotationId: quotation.id,
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          discountType: item.discountType,
          discountValue: item.discountValue,
          total: item.total
        })),
        { transaction: t }
      );
    }

    await t.commit();

    // Retornar cotización completa
    const createdQuotation = await Quotation.findByPk(quotation.id, {
      include: ['customer', { model: QuotationItem, as: 'items', include: ['product'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      quotation: createdQuotation
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al crear cotización:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
});

// PUT /api/quotations/:id - Actualizar cotización
router.put('/:id', requireCompanyContext, requireCompanyPermission(['quotations.update'], 'user'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      customerId,
      date,
      validUntil,
      notes,
      items,
      discountType = 'amount',
      discountValue = 0,
      taxRate = 0.07,
      status
    } = req.body;

    const quotation = await Quotation.findOne({
      where: {
        id,
        ...getCompanyFilter(req)
      }
    });

    if (!quotation) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }

    // 1. Recalcular totales (Solo si se envían items)
    let updateData = {};
    let shouldUpdateItems = false;
    let itemsToCreate = [];

    if (items) {
      shouldUpdateItems = true;
      let subtotalItems = 0;

      itemsToCreate = items.map(item => {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        const itemDiscountValue = parseFloat(item.discountValue) || 0;
        const itemDiscountType = item.discountType || 'amount';

        let itemTotalBeforeDiscount = qty * price;
        let itemDiscountAmount = 0;

        if (itemDiscountType === 'percentage') {
          itemDiscountAmount = itemTotalBeforeDiscount * (itemDiscountValue / 100);
        } else {
          itemDiscountAmount = itemDiscountValue;
        }

        const itemTotal = itemTotalBeforeDiscount - itemDiscountAmount;
        subtotalItems += itemTotal;

        return {
          ...item,
          discount: itemDiscountAmount,
          discountType: itemDiscountType,
          discountValue: itemDiscountValue,
          total: itemTotal
        };
      });

      // Calcular descuento global
      let globalDiscountAmount = 0;
      const globalDiscountVal = parseFloat(discountValue) || 0;

      if (discountType === 'percentage') {
        globalDiscountAmount = subtotalItems * (globalDiscountVal / 100);
      } else {
        globalDiscountAmount = globalDiscountVal;
      }

      const taxable = Math.max(0, subtotalItems - globalDiscountAmount);
      const effectiveTaxRate = parseFloat(taxRate);
      const tax = taxable * effectiveTaxRate;
      const total = taxable + tax;

      updateData = {
        subtotal: subtotalItems,
        discount: globalDiscountAmount,
        discountType,
        discountValue: globalDiscountVal,
        tax,
        taxRate: effectiveTaxRate,
        total,
        notes,
        date,
        validUntil
      };
    } else {
      // Si no se envían items, solo actualizar campos sueltos si vienen
      if (date) updateData.date = date;
      if (validUntil) updateData.validUntil = validUntil;
      if (notes !== undefined) updateData.notes = notes;
    }

    if (customerId) updateData.customerId = customerId;
    if (status) updateData.status = status;

    await quotation.update(updateData, { transaction: t });

    // 3. Reemplazar Items (Solo si se enviaron items)
    if (shouldUpdateItems) {
      // Borrar items anteriores
      await QuotationItem.destroy({
        where: { quotationId: id },
        transaction: t
      });

      // Crear nuevos items
      if (itemsToCreate.length > 0) {
        await QuotationItem.bulkCreate(
          itemsToCreate.map(item => ({
            quotationId: id,
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            discountType: item.discountType,
            discountValue: item.discountValue,
            total: item.total
          })),
          { transaction: t }
        );
      }
    }

    await t.commit();

    const updatedQuotation = await Quotation.findByPk(id, {
      include: ['customer', { model: QuotationItem, as: 'items', include: ['product'] }]
    });

    res.json({
      success: true,
      message: 'Cotización actualizada exitosamente',
      quotation: updatedQuotation
    });

  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar cotización:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// DELETE /api/quotations/:id - Eliminar cotización
router.delete('/:id', requireCompanyContext, requireCompanyPermission(['quotations.delete'], 'manager'), async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      where: {
        id: req.params.id,
        ...getCompanyFilter(req)
      }
    });

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Cotización no encontrada' });
    }

    await quotation.destroy();

    res.json({ success: true, message: 'Cotización eliminada exitosamente' });

  } catch (error) {
    console.error('Error al eliminar cotización:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

module.exports = router;
