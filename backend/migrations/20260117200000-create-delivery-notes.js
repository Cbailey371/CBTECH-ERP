'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('delivery_notes', {
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
            customer_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'customers',
                    key: 'id'
                },
                onDelete: 'RESTRICT',
                onUpdate: 'CASCADE'
            },
            sales_order_id: {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'sales_orders',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            },
            number: {
                type: Sequelize.STRING(30),
                allowNull: false
            },
            status: {
                type: Sequelize.ENUM('draft', 'delivered'),
                allowNull: false,
                defaultValue: 'draft'
            },
            date: {
                type: Sequelize.DATEONLY,
                allowNull: false
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            created_by: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            updated_by: {
                type: Sequelize.INTEGER,
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

        await queryInterface.createTable('delivery_note_items', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            delivery_note_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'delivery_notes',
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
                type: Sequelize.STRING,
                allowNull: false
            },
            quantity: {
                type: Sequelize.DECIMAL(18, 2),
                allowNull: false,
                defaultValue: 0
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

        await queryInterface.addIndex('delivery_notes', ['company_id', 'number'], {
            unique: true,
            name: 'delivery_notes_company_number_unique'
        });

        await queryInterface.addIndex('delivery_notes', ['company_id', 'customer_id'], {
            name: 'delivery_notes_company_customer_idx'
        });

        await queryInterface.addIndex('delivery_notes', ['status'], {
            name: 'delivery_notes_status_idx'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('delivery_note_items');
        await queryInterface.dropTable('delivery_notes');
        // Note: We might need to drop the ENUM type if it's PostgreSQL
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_delivery_notes_status";');
    }
};
