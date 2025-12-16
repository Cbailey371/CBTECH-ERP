'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // PostgreSQL specific command to add value to enum
      await queryInterface.sequelize.query(
        "ALTER TYPE \"enum_purchase_orders_status\" ADD VALUE IF NOT EXISTS 'finalized';",
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverting an enum addition in Postgres is complex (requires creating new type, migrating data, dropping old type).
    // For this context, we'll leave it as ir is rarely destructive to keep an unused enum value.
    // Ideally: create new type without 'finalized', convert column, drop old type.
    return Promise.resolve();
  }
};
