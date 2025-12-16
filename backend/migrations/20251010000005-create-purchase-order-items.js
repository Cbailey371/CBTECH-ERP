'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('purchase_order_items', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            purchase_order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'purchase_orders',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'id'
                }
            },
            description: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            quantity: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 1
            },
            unit_price: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            tax_rate: {
                type: Sequelize.DECIMAL(5, 2),
                allowNull: false,
                defaultValue: 0
            },
            subtotal: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            received_quantity: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('purchase_order_items');
    }
};
