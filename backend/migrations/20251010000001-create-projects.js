'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('projects', {
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
            code: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            name: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('planning', 'in_progress', 'on_hold', 'completed', 'cancelled'),
                allowNull: false,
                defaultValue: 'planning'
            },
            responsible_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            responsible_external: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'customers',
                    key: 'id'
                }
            },
            start_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            end_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
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
        await queryInterface.dropTable('projects');
    }
};
