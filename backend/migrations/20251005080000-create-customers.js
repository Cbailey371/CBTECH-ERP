'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('customers', {
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
            code: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            name: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING(20),
                allowNull: true
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            tax_id: {
                type: Sequelize.STRING(50),
                allowNull: true // Changed to NOT NULL in later migration
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },
            notes: {
                type: Sequelize.TEXT,
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

        await queryInterface.addIndex('customers', ['company_id'], {
            name: 'customers_company_id_idx'
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('customers');
    }
};
