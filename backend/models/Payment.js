const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Payment extends Model {
    static associate(models) {
        Payment.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
        Payment.belongsTo(models.Customer, { foreignKey: 'customer_id', as: 'customer' });
        Payment.belongsTo(models.SalesOrder, { foreignKey: 'sales_order_id', as: 'salesOrder' });
        Payment.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    }
}

Payment.init({
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
        type: DataTypes.BIGINT,
        allowNull: false
    },
    paymentNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'payment_number'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    method: {
        type: DataTypes.ENUM('cash', 'ach', 'check', 'credit_card', 'other'),
        allowNull: false,
        defaultValue: 'ach'
    },
    reference: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Payment;
