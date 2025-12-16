'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('suppliers', {
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
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            name: {
                type: Sequelize.STRING(200),
                allowNull: false
            },
            ruc: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            dv: {
                type: Sequelize.STRING(4),
                allowNull: true
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            phone: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            address: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            contact_name: {
                type: Sequelize.STRING(150),
                allowNull: true
            },
            payment_terms: {
                type: Sequelize.STRING(50),
                allowNull: true
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

        await queryInterface.addIndex('suppliers', ['company_id'], { name: 'suppliers_company_id_idx' });
        await queryInterface.addIndex('suppliers', ['company_id', 'name'], { name: 'suppliers_company_name_idx' });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('suppliers');
    }
};
