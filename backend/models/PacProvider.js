const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PacProvider = sequelize.define('PacProvider', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: 'Code used internally (e.g. WEBPOS)'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Display Name (e.g. WEBPOS Internet)'
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true
    },
    test_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'API URL for Testing/Sandbox'
    },
    prod_url: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'API URL for Production'
    },
    auth_type: {
        type: DataTypes.ENUM('API_KEY', 'USER_PASS', 'OAUTH'),
        defaultValue: 'API_KEY',
        comment: 'Authentication method required by the PAC'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'pac_providers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = PacProvider;
