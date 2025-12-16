'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Increase phone column length
        await queryInterface.changeColumn('customers', 'phone', {
            type: Sequelize.STRING(50),
            allowNull: true
        });

        // 2. Add missing trade_name column
        await queryInterface.addColumn('customers', 'trade_name', {
            type: Sequelize.STRING(200),
            allowNull: true,
            after: 'name'
        });

        // 3. Add missing dv column
        // Checking if it exists first just in case, but migration history says no.
        // However, robust migrations often check.
        // For simplicity in this environment, I'll assume it's missing based on previous file review.
        await queryInterface.addColumn('customers', 'dv', {
            type: Sequelize.STRING(4),
            allowNull: true,
            after: 'tax_id'
        });
    },

    async down(queryInterface, Sequelize) {
        // Revert changes
        await queryInterface.changeColumn('customers', 'phone', {
            type: Sequelize.STRING(20),
            allowNull: true
        });
        await queryInterface.removeColumn('customers', 'trade_name');
        await queryInterface.removeColumn('customers', 'dv');
    }
};
