const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PurchaseOrder = sequelize.define('PurchaseOrder', {
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
    supplierId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'supplier_id',
        references: {
            model: 'suppliers',
            key: 'id'
        }
    },
    orderNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'order_number'
        // Unique per company logic handled in controller/hook
    },
    status: {
        type: DataTypes.ENUM('draft', 'approval', 'approved', 'sent', 'partial_received', 'received', 'closed', 'cancelled', 'rejected', 'finalized'),
        defaultValue: 'draft',
        allowNull: false
    },
    issueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'issue_date'
    },
    deliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'delivery_date'
    },
    paymentTerms: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'payment_terms'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
    },
    taxTotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        field: 'tax_total'
    },
    total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true
});

module.exports = PurchaseOrder;
