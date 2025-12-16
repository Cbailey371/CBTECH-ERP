'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sales_orders', {
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
      quotation_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'quotations',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      order_number: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'confirmed', 'in_progress', 'fulfilled', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft'
      },
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'USD'
      },
      subtotal: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0
      },
      tax_total: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: false,
        defaultValue: 0
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

    await queryInterface.addIndex('sales_orders', ['company_id', 'order_number'], {
      unique: true,
      name: 'sales_orders_company_order_unique'
    });

    await queryInterface.addIndex('sales_orders', ['company_id', 'customer_id'], {
      name: 'sales_orders_company_customer_idx'
    });

    await queryInterface.addIndex('sales_orders', ['status'], {
      name: 'sales_orders_status_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('sales_orders', 'sales_orders_status_idx');
    await queryInterface.removeIndex('sales_orders', 'sales_orders_company_customer_idx');
    await queryInterface.removeIndex('sales_orders', 'sales_orders_company_order_unique');
    await queryInterface.dropTable('sales_orders');
  }
};

