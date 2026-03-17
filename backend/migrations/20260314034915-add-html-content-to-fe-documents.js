'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('fe_documents', 'html_content', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Contenido HTML original devuelto por el PAC (responseData2)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('fe_documents', 'html_content');
  }
};
