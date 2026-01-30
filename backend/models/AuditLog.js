const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Puede ser null para acciones del sistema o errores antes de auth
        field: 'user_id'
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'company_id'
    },
    action: {
        type: DataTypes.STRING(100), // LOGIN, CREATE_USER, DELETE_CONTRACT, etc
        allowNull: false
    },
    entityType: {
        type: DataTypes.STRING(50), // User, Contract, Product...
        allowNull: true,
        field: 'entity_type'
    },
    entityId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'entity_id'
    },
    oldData: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'old_data'
    },
    newData: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'new_data'
    },
    ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
        field: 'ip_address'
    },
    userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'user_agent'
    },
    status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILURE', 'WARNING'),
        defaultValue: 'SUCCESS'
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true
    }
}, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // Auditoría es inmutable
});

module.exports = AuditLog;
