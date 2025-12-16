'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('contracts');

        if (!tableInfo.project_id) {
            await queryInterface.addColumn('contracts', 'project_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'projects',
                    key: 'id'
                },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE'
            });

            // Add index for performance
            await queryInterface.addIndex('contracts', ['project_id'], {
                name: 'contracts_project_id_idx'
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('contracts');

        if (tableInfo.project_id) {
            await queryInterface.removeIndex('contracts', 'contracts_project_id_idx');
            await queryInterface.removeColumn('contracts', 'project_id');
        }
    }
};
