'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('audit_logs', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.BIGINT
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            company_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'companies',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            },
            action: {
                type: Sequelize.STRING(100),
                allowNull: false
            },
            entity_type: {
                type: Sequelize.STRING(50),
                allowNull: true
            },
            entity_id: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            old_data: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            new_data: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            ip_address: {
                type: Sequelize.STRING(45),
                allowNull: true
            },
            user_agent: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('SUCCESS', 'FAILURE', 'WARNING'),
                defaultValue: 'SUCCESS'
            },
            metadata: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Índices para mejorar rendimiento de consultas de auditoría
        await queryInterface.addIndex('audit_logs', ['company_id']);
        await queryInterface.addIndex('audit_logs', ['user_id']);
        await queryInterface.addIndex('audit_logs', ['action']);
        await queryInterface.addIndex('audit_logs', ['created_at']);
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('audit_logs');
    }
};
