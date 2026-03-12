'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('customers', 'tipo_receptor', {
      type: Sequelize.STRING(2),
      allowNull: true,
      defaultValue: '01',
      comment: '01: Contribuyente, 02: Consumidor Final, 03: Gobierno, 04: Extranjero'
    });

    await queryInterface.addColumn('customers', 'tipo_identificacion', {
      type: Sequelize.STRING(2),
      allowNull: true,
      defaultValue: '02',
      comment: '01: Cedula, 02: RUC, 03: Pasaporte'
    });

    await queryInterface.addColumn('customers', 'cod_ubi', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Formato: Provincia-Distrito-Corregimiento (ej: 8-8-1)'
    });

    await queryInterface.addColumn('customers', 'pais_receptor', {
      type: Sequelize.STRING(2),
      allowNull: true,
      defaultValue: 'PA'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('customers', 'pais_receptor');
    await queryInterface.removeColumn('customers', 'cod_ubi');
    await queryInterface.removeColumn('customers', 'tipo_identificacion');
    await queryInterface.removeColumn('customers', 'tipo_receptor');
  }
};
