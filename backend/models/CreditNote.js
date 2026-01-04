const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class CreditNote extends Model {
    static associate(models) {
        CreditNote.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
        CreditNote.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
        CreditNote.belongsTo(models.SalesOrder, { foreignKey: 'sales_order_id', as: 'salesOrder' });
        CreditNote.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    }
}

CreditNote.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    company_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sales_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
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
    fiscal_cufe: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    fiscal_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    items: {
        type: DataTypes.JSONB,
        defaultValue: []
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    modelName: 'CreditNote',
    tableName: 'credit_notes',
    underscored: true,
});

module.exports = CreditNote;
