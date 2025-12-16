'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('contracts', {
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
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            title: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('draft', 'active', 'suspended', 'expired', 'terminated', 'renewed', 'cancelled'),
                defaultValue: 'draft',
                allowNull: false
            },
            billing_cycle: {
                type: Sequelize.ENUM('monthly', 'quarterly', 'yearly', 'one_time'),
                defaultValue: 'monthly',
                allowNull: false
            },
            sla_details: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            renewal_type: {
                type: Sequelize.ENUM('manual', 'auto'),
                defaultValue: 'manual',
                allowNull: false
            },
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            value: {
                type: Sequelize.DECIMAL(15, 2),
                allowNull: true,
                defaultValue: 0
            },
            file_url: {
                type: Sequelize.STRING(255),
                allowNull: true
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
        await queryInterface.dropTable('contracts');
    }
};
