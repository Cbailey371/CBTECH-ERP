const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryNote = sequelize.define('DeliveryNote', {
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
    salesOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'sales_order_id',
        references: {
            model: 'sales_orders',
            key: 'id'
        }
    },
    number: {
        type: DataTypes.STRING(30),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('draft', 'delivered'),
        allowNull: false,
        defaultValue: 'draft'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
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
    tableName: 'delivery_notes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = DeliveryNote;
