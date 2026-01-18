'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('companies', 'login_logo', {
            type: Sequelize.STRING,
            allowNull: true
        });
        await queryInterface.addColumn('companies', 'document_logo', {
            type: Sequelize.STRING,
            allowNull: true
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('companies', 'login_logo');
        await queryInterface.removeColumn('companies', 'document_logo');
    }
};
