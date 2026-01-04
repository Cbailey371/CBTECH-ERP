const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SalesOrderItem = sequelize.define('SalesOrderItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    salesOrderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'sales_order_id',
        references: {
            model: 'sales_orders',
            key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'product_id',
        references: {
            model: 'products',
            key: 'id'
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 1
    },
    unitPrice: {
        type: DataTypes.DECIMAL(18, 4), // 4 decimales para precisión
        allowNull: false,
        field: 'unit_price'
    },
    discount: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0
    },
    taxRate: {
        type: DataTypes.DECIMAL(5, 4), // Ejemplo: 0.0700
        allowNull: false,
        defaultValue: 0,
        field: 'tax_rate'
    },
    subtotal: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false
        // qty * price
    },
    total: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false
        // subtotal - discount + tax
    }
}, {
    tableName: 'sales_order_items',
    timestamps: false,
    indexes: [
        {
            fields: ['sales_order_id'],
            name: 'sales_order_items_order_idx'
        }
    ]
});

module.exports = SalesOrderItem;
