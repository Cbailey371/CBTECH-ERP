const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class CreditNote extends Model {
    static associate(models) {
        CreditNote.belongsTo(models.Company, { foreignKey: 'companyId', as: 'company' });
        CreditNote.belongsTo(models.Customer, { foreignKey: 'customerId', as: 'customer' });
        CreditNote.belongsTo(models.SalesOrder, { foreignKey: 'salesOrderId', as: 'salesOrder' });
        CreditNote.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    }
}

CreditNote.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'company_id'
    },
    customerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'customer_id'
    },
    salesOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sales_order_id'
    },
    number: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('draft', 'authorized', 'cancelled'),
        defaultValue: 'draft'
    },
    fiscalCufe: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'fiscal_cufe'
    },
    fiscalNumber: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'fiscal_number'
    },
    items: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'created_by'
    }
}, {
    sequelize,
    modelName: 'CreditNote',
    tableName: 'credit_notes',
    underscored: true,
});

module.exports = CreditNote;
