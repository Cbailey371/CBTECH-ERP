const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FE_Document = sequelize.define('FE_Document', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    // Polymorphic-like relationship or direct link to SalesOrder
    salesOrderId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'sales_order_id',
        references: {
            model: 'sales_orders',
            key: 'id'
        }
    },
    docType: {
        type: DataTypes.ENUM('01', '03', '04'), // 01=Factura, 03=NC, 04=ND
        allowNull: false,
        defaultValue: '01',
        field: 'doc_type'
    },
    cufe: {
        type: DataTypes.STRING(66),
        allowNull: true,
        unique: true
    },
    qrUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'qr_url'
    },
    xmlSigned: {
        type: DataTypes.TEXT, // Store XML as text/blob
        allowNull: true,
        field: 'xml_signed'
    },
    authDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'auth_date'
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'SIGNING', 'AUTHORIZED', 'REJECTED', 'ANNULLED'),
        defaultValue: 'DRAFT',
        allowNull: false
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'rejection_reason'
    },
    pacName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'pac_name'
    },
    environment: {
        type: DataTypes.ENUM('TEST', 'PROD'),
        allowNull: false,
        defaultValue: 'TEST'
    }
}, {
    tableName: 'fe_documents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['cufe'],
            unique: true,
            name: 'fe_documents_cufe_unique'
        },
        {
            fields: ['sales_order_id'],
            name: 'fe_documents_sales_order_idx'
        }
    ]
});

module.exports = FE_Document;
