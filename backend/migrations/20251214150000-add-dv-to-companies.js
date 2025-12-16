'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('companies', 'dv', {
            type: Sequelize.STRING(4),
            allowNull: true,
            after: 'tax_id' // Try to place it after tax_id if supported, otherwise just appends
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('companies', 'dv');
    }
};
