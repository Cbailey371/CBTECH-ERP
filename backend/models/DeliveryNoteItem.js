const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DeliveryNoteItem = sequelize.define('DeliveryNoteItem', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    deliveryNoteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'delivery_note_id',
        references: {
            model: 'delivery_notes',
            key: 'id'
        }
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
        type: DataTypes.STRING,
        allowNull: false
    },
    quantity: {
        type: DataTypes.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'delivery_note_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = DeliveryNoteItem;
