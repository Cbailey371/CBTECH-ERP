'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'code', {
            type: Sequelize.STRING(50),
            allowNull: true,
            after: 'id' // Optional: tries to place it after id if supported
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('users', 'code');
    }
};
