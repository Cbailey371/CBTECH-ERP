'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'trade_name', {
      type: Sequelize.STRING(200),
      allowNull: false,
      defaultValue: ''
    });

    await queryInterface.addColumn('customers', 'dv', {
      type: Sequelize.STRING(4),
      allowNull: false,
      defaultValue: ''
    });

    await queryInterface.changeColumn('customers', 'tax_id', {
      type: Sequelize.STRING(50),
      allowNull: false
    });

    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `UPDATE customers
         SET trade_name = CASE
           WHEN trade_name = '' OR trade_name IS NULL THEN name
           ELSE trade_name
         END,
         dv = CASE
           WHEN dv = '' OR dv IS NULL THEN '00'
           ELSE dv
         END`,
        { transaction }
      );
    });

    await queryInterface.changeColumn('customers', 'trade_name', {
      type: Sequelize.STRING(200),
      allowNull: false
    });

    await queryInterface.changeColumn('customers', 'dv', {
      type: Sequelize.STRING(4),
      allowNull: false
    });

    await queryInterface.addIndex('customers', ['company_id', 'tax_id', 'dv'], {
      unique: true,
      name: 'customers_company_taxid_dv_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('customers', 'customers_company_taxid_dv_unique');
    await queryInterface.changeColumn('customers', 'tax_id', {
      type: Sequelize.STRING(50),
      allowNull: true
    });
    await queryInterface.removeColumn('customers', 'dv');
    await queryInterface.removeColumn('customers', 'trade_name');
  }
};

