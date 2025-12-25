const express = require('express');
const router = express.Router();
const { Product, Company } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { companyContext, requireCompanyContext } = require('../middleware/companyContext');
const { Op } = require('sequelize');

// Middleware para todas las rutas
router.use(authenticateToken);
router.use(companyContext);
router.use(requireCompanyContext);

// GET /api/products - Listar productos de la empresa
router.get('/', async (req, res) => {
  try {
    const { type, search, limit = 50, offset = 0, is_active } = req.query;
    const companyId = req.companyContext.companyId;

    const where = { companyId };

    if (type) {
      where.type = type;
    }

    if (search) {
      where[Op.or] = [
        { description: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { sku: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (is_active !== undefined) {
      where.isActive = is_active === 'true';
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['description', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        total: count,
        products: rows
      }
    });
  } catch (error) {
    console.error('Error al listar productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
});

// GET /api/products/:id - Obtener un producto
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyContext.companyId;

    const product = await Product.findOne({
      where: { id, companyId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el producto'
    });
  }
});

// POST /api/products - Crear producto
router.post('/', async (req, res) => {
  try {
    const companyId = req.companyContext.companyId;
    const { type, code, sku, description, cost, margin } = req.body;

    // Validaciones básicas
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'La descripción es obligatoria'
      });
    }

    // Generar código automáticamente si no se proporciona
    let productCode = code;
    if (!productCode) {
      const prefix = type === 'service' ? 'SERV' : 'PROD';

      // Buscar el último código con este prefijo para esta empresa
      const lastProduct = await Product.findOne({
        where: {
          companyId,
          code: {
            [Op.like]: `${prefix}-%`
          }
        },
        order: [['code', 'DESC']]
      });

      let nextNumber = 1;
      if (lastProduct && lastProduct.code) {
        // Extraer el número del último código (ej: PROD-005 -> 5)
        const match = lastProduct.code.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Formatear con padding de 3 dígitos
      productCode = `${prefix}-${String(nextNumber).padStart(3, '0')}`;
    }

    // Validar unicidad de código/SKU dentro de la empresa
    const existingCode = await Product.findOne({ where: { companyId, code: productCode } });
    if (existingCode) {
      return res.status(400).json({ success: false, message: 'El código ya existe' });
    }

    if (sku) {
      const existingSku = await Product.findOne({ where: { companyId, sku } });
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'El SKU ya existe' });
      }
    }

    const product = await Product.create({
      companyId,
      type: type || 'product',
      code: productCode,
      sku,
      description,
      cost: cost || 0,
      margin: margin || 0
      // El precio se calcula en el hook beforeSave
    });

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { product }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el producto',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyContext.companyId;
    const { type, code, sku, description, cost, margin, isActive } = req.body;

    const product = await Product.findOne({ where: { id, companyId } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Validar unicidad si cambian code/sku
    if (code && code !== product.code) {
      const existingCode = await Product.findOne({ where: { companyId, code } });
      if (existingCode) return res.status(400).json({ success: false, message: 'El código ya existe' });
    }
    if (sku && sku !== product.sku) {
      const existingSku = await Product.findOne({ where: { companyId, sku } });
      if (existingSku) return res.status(400).json({ success: false, message: 'El SKU ya existe' });
    }

    await product.update({
      type,
      code,
      sku,
      description,
      cost,
      margin,
      isActive
      // El precio se recalcula automáticamente por el hook si cost o margin cambian
    });

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: { product }
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el producto'
    });
  }
});

// DELETE /api/products/:id - Eliminar (Validando uso)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyContext.companyId;

    const product = await Product.findOne({ where: { id, companyId } });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar si está en uso en alguna cotización (Items)
    // Necesitamos importar QuotationItem (asegurar que esté disponible)
    const { QuotationItem } = require('../models');

    const usageCount = await QuotationItem.count({
      where: { productId: id }
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el producto porque está siendo usado en ${usageCount} cotización(es).`
      });
    }

    // Si no está en uso, Hard Delete
    await product.destroy();

    res.json({
      success: true,
      message: 'Producto eliminado permanentemente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el producto',
      error: error.message
    });
  }
});

module.exports = router;
