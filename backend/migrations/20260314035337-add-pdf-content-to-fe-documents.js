'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('fe_documents', 'pdf_content', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Contenido PDF original base64 devuelto por el PAC (responseData3)'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('fe_documents', 'pdf_content');
  }
};
