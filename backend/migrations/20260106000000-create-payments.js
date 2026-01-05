'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Create Payments table
        await queryInterface.createTable('payments', {
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
                onDelete: 'CASCADE'
            },
            sales_order_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'sales_orders',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE' // If invoice deleted, payments deleted (or restrict, but cascade safe for now)
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            method: {
                type: Sequelize.ENUM('cash', 'ach', 'check', 'credit_card', 'other'),
                allowNull: false,
                defaultValue: 'ach'
            },
            reference: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true
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

        // 2. Add payment tracking columns to SalesOrder
        await queryInterface.addColumn('sales_orders', 'payment_status', {
            type: Sequelize.ENUM('unpaid', 'partial', 'paid'),
            allowNull: false,
            defaultValue: 'unpaid'
        });

        await queryInterface.addColumn('sales_orders', 'paid_amount', {
            type: Sequelize.DECIMAL(18, 2), // Matching total precision
            allowNull: false,
            defaultValue: 0
        });

        await queryInterface.addColumn('sales_orders', 'balance', {
            type: Sequelize.DECIMAL(18, 2),
            allowNull: false,
            defaultValue: 0 // Will initialize to total by logic, or 0 if draft?
        });

        // Add Index for faster lookup
        await queryInterface.addIndex('sales_orders', ['payment_status']);
        await queryInterface.addIndex('payments', ['sales_order_id']);
        await queryInterface.addIndex('payments', ['customer_id', 'date']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('sales_orders', 'balance');
        await queryInterface.removeColumn('sales_orders', 'paid_amount');
        await queryInterface.removeColumn('sales_orders', 'payment_status');
        await queryInterface.dropTable('payments');
    }
};
