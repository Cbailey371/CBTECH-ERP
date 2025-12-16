'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('customers');

        // 1. Increase phone column length (always safe to run if type is compatible)
        // Actually, describeTable returns column details. We can check type too.
        // But changeColumn is usually safe if it just increases length.
        // Let's keep it unconditional or check current length? 
        // Unconditional changeColumn to wider type is usually fine in Postgres.
        await queryInterface.changeColumn('customers', 'phone', {
            type: Sequelize.STRING(50),
            allowNull: true
        });

        // 2. Add missing trade_name column
        if (!tableInfo.trade_name) {
            await queryInterface.addColumn('customers', 'trade_name', {
                type: Sequelize.STRING(200),
                allowNull: true,
                after: 'name'
            });
        }

        // 3. Add missing dv column
        // Checking if it exists first just in case, but migration history says no.
        // However, robust migrations often check.
        // For simplicity in this environment, I'll assume it's missing based on previous file review.
        if (!tableInfo.dv) {
            await queryInterface.addColumn('customers', 'dv', {
                type: Sequelize.STRING(4),
                allowNull: true,
                after: 'tax_id'
            });
        }
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
