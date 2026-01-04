'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('credit_notes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'companies',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            sales_order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sales_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            number: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            reason: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            subtotal: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            tax: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            total: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            status: {
                type: Sequelize.ENUM('draft', 'authorized', 'cancelled'),
                allowNull: false,
                defaultValue: 'draft'
            },
            fiscal_cufe: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            fiscal_number: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            items: {
                type: Sequelize.JSONB, // Store items as JSONB for simplicity since they are a snapshot
                allowNull: false,
                defaultValue: []
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Add unique constraint per company for the number
        await queryInterface.addIndex('credit_notes', ['company_id', 'number'], {
            unique: true,
            name: 'credit_notes_number_company_unique'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('credit_notes');
    }
};
