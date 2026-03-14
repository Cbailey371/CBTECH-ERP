'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'objeto_retencion', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'ID del catálogo de Objetos de Retención DGI'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'objeto_retencion');
  }
};
