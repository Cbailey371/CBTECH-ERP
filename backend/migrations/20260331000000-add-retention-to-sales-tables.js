'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add retention to sales_orders
    await queryInterface.addColumn('sales_orders', 'retention', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // Add retention to quotations
    await queryInterface.addColumn('quotations', 'retention', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // Add retention to credit_notes
    await queryInterface.addColumn('credit_notes', 'retention', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sales_orders', 'retention');
    await queryInterface.removeColumn('quotations', 'retention');
    await queryInterface.removeColumn('credit_notes', 'retention');
  }
};
