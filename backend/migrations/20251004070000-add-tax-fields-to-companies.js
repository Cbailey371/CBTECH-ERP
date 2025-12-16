'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
      const tableDescription = await queryInterface.describeTable(tableName).catch(() => ({}));
      if (!tableDescription[columnName]) {
        console.log(`Adding column ${columnName} to ${tableName}.`);
        await queryInterface.addColumn(tableName, columnName, columnDefinition);
      } else {
        console.log(`Column ${columnName} already exists in ${tableName}, skipping.`);
      }
    };

    await addColumnIfNotExists('companies', 'tax_name', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'ITBMS',
      comment: 'Nombre del impuesto principal (ej: ITBMS, IVA, VAT)'
    });

    await addColumnIfNotExists('companies', 'tax_rate', {
      type: Sequelize.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0.07,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Tasa de impuesto como decimal (0.07 = 7%)'
    });
  },

  async down(queryInterface, Sequelize) {
    const removeColumnIfExists = async (tableName, columnName) => {
      const tableDescription = await queryInterface.describeTable(tableName).catch(() => ({}));
      if (tableDescription[columnName]) {
        console.log(`Removing column ${columnName} from ${tableName}.`);
        await queryInterface.removeColumn(tableName, columnName);
      } else {
        console.log(`Column ${columnName} does not exist in ${tableName}, skipping.`);
      }
    };

    await removeColumnIfExists('companies', 'tax_name');
    await removeColumnIfExists('companies', 'tax_rate');
  }
};