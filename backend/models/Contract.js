const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contract = sequelize.define('Contract', {
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
    code: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    title: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('draft', 'active', 'suspended', 'expired', 'terminated', 'renewed', 'cancelled'),
        defaultValue: 'draft',
        allowNull: false
    },
    billingCycle: {
        type: DataTypes.ENUM('monthly', 'quarterly', 'yearly', 'one_time'),
        defaultValue: 'monthly',
        allowNull: false,
        field: 'billing_cycle'
    },
    slaDetails: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'sla_details'
    },
    renewalType: {
        type: DataTypes.ENUM('manual', 'auto'),
        defaultValue: 'manual',
        allowNull: false,
        field: 'renewal_type'
    },
    startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date'
    },
    endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'end_date'
    },
    value: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
    },
    fileUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'file_url'
    }
}, {
    tableName: 'contracts',
    timestamps: true,
    underscored: true
});

module.exports = Contract;
