'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('fe_documents');
    if (!tableInfo.protocol) {
      await queryInterface.addColumn('fe_documents', 'protocol', {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Número de Protocolo de Autorización del PAC'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('fe_documents', 'protocol');
  }
};
