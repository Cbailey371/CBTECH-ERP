const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'company_id',
    references: {
      model: 'companies',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('product', 'service'),
    allowNull: false,
    defaultValue: 'product'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  margin: {
    type: DataTypes.DECIMAL(5, 4), // Ej: 0.30 para 30%
    allowNull: false,
    defaultValue: 0
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeSave: (product) => {
      // Calcular precio automáticamente: Costo / (1 - Margen)
      // Si margen es 1 (100%) o más, evitar división por cero o negativo absurdo, aunque validación debería prevenirlo.
      const cost = parseFloat(product.cost) || 0;
      const margin = parseFloat(product.margin) || 0;

      if (margin >= 1) {
        // Fallback de seguridad, aunque debería validarse antes
        product.price = cost;
      } else {
        // Fórmula: Precio = Costo / (1 - Margen)
        // Ej: 100 / (1 - 0.30) = 100 / 0.70 = 142.86
        product.price = cost / (1 - margin);
      }
    }
  }
});

module.exports = Product;
