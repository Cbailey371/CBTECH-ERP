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

    await addColumnIfNotExists('companies', 'industry', {
      type: Sequelize.STRING(100),
      allowNull: true,
      comment: 'Sector o industria de la empresa'
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

    await removeColumnIfExists('companies', 'industry');
  }
};