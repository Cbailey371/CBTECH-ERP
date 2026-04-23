const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QuotationHistory = sequelize.define('QuotationHistory', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  quotationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quotation_id',
    references: {
      model: 'quotations',
      key: 'id'
    }
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  changedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'changed_by',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'quotation_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false // Auditoría es inmutable
});

module.exports = QuotationHistory;
