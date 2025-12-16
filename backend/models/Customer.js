const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Customer = sequelize.define('Customer', {
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
  code: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      len: [2, 200],
      notEmpty: true
    }
  },
  tradeName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    field: 'trade_name',
    validate: {
      len: [2, 200],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'tax_id'
  },
  dv: {
    type: DataTypes.STRING(4),
    allowNull: false,
    field: 'dv',
    validate: {
      notEmpty: true,
      len: [1, 4]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'customers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['company_id'],
      name: 'customers_company_id_idx'
    },
    {
      unique: true,
      fields: ['company_id', 'tax_id', 'dv'],
      name: 'customers_company_taxid_dv_unique'
    },
    {
      fields: ['company_id', 'email'],
      name: 'customers_company_email_idx'
    },
    {
      fields: ['company_id', 'is_active'],
      name: 'customers_company_active_idx'
    }
  ]
});

module.exports = Customer;
