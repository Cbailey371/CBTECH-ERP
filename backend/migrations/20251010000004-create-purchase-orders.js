'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('purchase_orders', {
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
                }
            },
            supplier_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'suppliers',
                    key: 'id'
                }
            },
            order_number: {
                type: Sequelize.STRING(50),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('draft', 'approval', 'approved', 'sent', 'partial_received', 'received', 'closed', 'cancelled', 'rejected', 'finalized'),
                defaultValue: 'draft',
                allowNull: false
            },
            issue_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
                defaultValue: Sequelize.NOW
            },
            delivery_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            payment_terms: {
                type: Sequelize.STRING(100),
                allowNull: true
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            subtotal: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            tax_total: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            total: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: false,
                defaultValue: 0
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
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
        await queryInterface.dropTable('purchase_orders');
    }
};
