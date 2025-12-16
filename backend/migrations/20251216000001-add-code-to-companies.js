'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('companies');

        if (!tableInfo.code) {
            await queryInterface.addColumn('companies', 'code', {
                type: Sequelize.STRING(50),
                allowNull: true,
                after: 'id'
            });
        }

        if (!tableInfo.dv) {
            await queryInterface.addColumn('companies', 'dv', {
                type: Sequelize.STRING(4),
                allowNull: true,
                after: 'tax_id'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('companies', 'code');
        await queryInterface.removeColumn('companies', 'dv');
    }
};
