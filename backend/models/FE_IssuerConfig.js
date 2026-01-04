const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FE_IssuerConfig = sequelize.define('FE_IssuerConfig', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // One config per company
        field: 'company_id',
        references: {
            model: 'companies', // Assuming table name is 'companies'
            key: 'id'
        }
    },
    ruc: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    dv: {
        type: DataTypes.STRING(2),
        allowNull: false,
        comment: 'Digito Verificador'
    },
    razonSocial: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'razon_social'
    },
    direccion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sucursal: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '0000',
        comment: 'Codigo de Sucursal DGI'
    },
    puntoDeVenta: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '01',
        field: 'punto_de_venta',
        comment: 'Codigo de Punto de Venta DGI'
    },
    // PAC Configuration
    pacProvider: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'WEBPOS',
        field: 'pac_provider'
    },
    environment: {
        type: DataTypes.ENUM('TEST', 'PROD'),
        allowNull: false,
        defaultValue: 'TEST'
    },
    authData: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'auth_data',
        comment: 'Stores API Keys, License Codes, Certificates, etc.'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    }
}, {
    tableName: 'fe_issuer_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = FE_IssuerConfig;
