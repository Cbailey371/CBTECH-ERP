'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('quotations', 'sequence', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Asignar valores consecutivos por empresa
    await queryInterface.sequelize.query(`
      WITH ranked AS (
        SELECT
          id,
          company_id,
          ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at, id) AS seq
        FROM quotations
      )
      UPDATE quotations
      SET sequence = ranked.seq
      FROM ranked
      WHERE quotations.id = ranked.id;
    `);

    await queryInterface.changeColumn('quotations', 'sequence', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });

    await queryInterface.addIndex('quotations', ['company_id', 'sequence'], {
      unique: true,
      name: 'quotations_company_sequence_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('quotations', 'quotations_company_sequence_unique');
    await queryInterface.removeColumn('quotations', 'sequence');
  }
};

