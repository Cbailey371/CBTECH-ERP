'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add code column
        await queryInterface.addColumn('products', 'code', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'type'
        });

        // 2. Add cost column
        await queryInterface.addColumn('products', 'cost', {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
            after: 'description'
        });

        // 3. Add margin column
        await queryInterface.addColumn('products', 'margin', {
            type: Sequelize.DECIMAL(5, 4),
            allowNull: false,
            defaultValue: 0,
            after: 'cost'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('products', 'code');
        await queryInterface.removeColumn('products', 'cost');
        await queryInterface.removeColumn('products', 'margin');
    }
};
