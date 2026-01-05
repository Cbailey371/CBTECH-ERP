const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesOrder = sequelize.define('SalesOrder', {
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
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'customer_id',
    references: {
      model: 'customers',
      key: 'id'
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  },
  quotationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'quotation_id',
    references: {
      model: 'quotations',
      key: 'id'
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
  },
  orderNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'order_number',
    validate: {
      notEmpty: true,
      len: [3, 30]
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'confirmed', 'in_progress', 'fulfilled', 'cancelled'),
    allowNull: false,
    defaultValue: 'draft'
  },
  issueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'issue_date'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'USD'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  discountType: {
    type: DataTypes.ENUM('percentage', 'amount'),
    allowNull: false,
    defaultValue: 'amount',
    field: 'discount_type'
  },
  discountValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'discount_value'
  },
  subtotal: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0
  },
  taxTotal: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'tax_total'
  },
  total: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    allowNull: false,
    defaultValue: 'unpaid',
    field: 'payment_status'
  },
  paidAmount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'paid_amount'
  },
  balance: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'sales_orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['company_id', 'order_number'],
      name: 'sales_orders_company_order_unique'
    },
    {
      fields: ['company_id', 'customer_id'],
      name: 'sales_orders_company_customer_idx'
    },
    {
      fields: ['status'],
      name: 'sales_orders_status_idx'
    }
  ]
});

module.exports = SalesOrder;

