'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('quotation_items', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            quotation_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'quotations',
                    key: 'id'
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            product_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'products',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            quantity: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 1
            },
            unit_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            discount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            discount_type: {
                type: Sequelize.ENUM('percentage', 'amount'),
                allowNull: false,
                defaultValue: 'amount'
            },
            discount_value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
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

        await queryInterface.addIndex('quotation_items', ['quotation_id'], {
            name: 'quotation_items_quotation_id_idx'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('quotation_items');
    }
};
