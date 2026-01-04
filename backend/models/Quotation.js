const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Quotation = sequelize.define('Quotation', {
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
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'customer_id',
    references: {
      model: 'customers',
      key: 'id'
    }
  },
  sequence: {
    type: DataTypes.INTEGER,
    allowNull: true // Allow null initially so beforeCreate can set it
  },
  number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  validUntil: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'valid_until'
  },
  status: {
    type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired', 'invoiced'),
    defaultValue: 'draft',
    allowNull: false
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
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  taxRate: {
    type: DataTypes.DECIMAL(5, 4), // Para guardar 0.0700
    allowNull: false,
    defaultValue: 0.07,
    field: 'tax_rate'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'quotations',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['company_id']
    },
    {
      fields: ['customer_id']
    },
    {
      fields: ['number']
    },
    {
      fields: ['status']
    },
    {
      fields: ['company_id', 'sequence'],
      unique: true
    }
  ],
  hooks: {
    beforeCreate: async (quotation, options) => {
      if (!quotation.sequence) {
        const lastQuotation = await quotation.constructor.findOne({
          where: { companyId: quotation.companyId },
          order: [['sequence', 'DESC']],
          transaction: options.transaction
        });
        quotation.sequence = lastQuotation ? lastQuotation.sequence + 1 : 1;

        // Force update the number to match the sequence (prevent frontend conflicts)
        const year = new Date().getFullYear();
        quotation.number = `COT-${year}-${String(quotation.sequence).padStart(4, '0')}`;
      }
    }
  }
});

module.exports = Quotation;
