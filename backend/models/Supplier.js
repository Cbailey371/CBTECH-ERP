const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Supplier = sequelize.define('Supplier', {
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
    ruc: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'ruc'
        // Unique combined with companyId handled by index if needed, but RUC is often optional for small vendors
    },
    dv: {
        type: DataTypes.STRING(4),
        allowNull: true,
        field: 'dv'
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    contactName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'contact_name'
    },
    paymentTerms: {
        type: DataTypes.STRING(50), // e.g., 'contado', '30_days', etc.
        allowNull: true,
        field: 'payment_terms'
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
    tableName: 'suppliers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['company_id'],
            name: 'suppliers_company_id_idx'
        },
        {
            fields: ['company_id', 'name'],
            name: 'suppliers_company_name_idx'
        },
        {
            fields: ['company_id', 'is_active'],
            name: 'suppliers_company_active_idx'
        }
    ]
});

module.exports = Supplier;
