'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('tasks', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            project_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'projects',
                    key: 'id'
                }
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('pending', 'in_progress', 'review', 'completed', 'cancelled'),
                allowNull: false,
                defaultValue: 'pending'
            },
            priority: {
                type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
                allowNull: false,
                defaultValue: 'medium'
            },
            assigned_to: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            external_responsible_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },
            due_date: {
                type: Sequelize.DATEONLY,
                allowNull: true
            },
            parent_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tasks',
                    key: 'id'
                }
            },
            completed_at: {
                type: Sequelize.DATE,
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
        await queryInterface.dropTable('tasks');
    }
};
