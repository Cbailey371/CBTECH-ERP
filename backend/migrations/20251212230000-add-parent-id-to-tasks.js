'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // Check if column exists first to be safe, but addColumn usually fails if exists
        try {
            await queryInterface.addColumn('tasks', 'parent_id', {
                type: Sequelize.INTEGER,
                allowNull: true,
                references: {
                    model: 'tasks',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL'
            });
        } catch (error) {
            console.log('Column might already exist or table missing: ' + error.message);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('tasks', 'parent_id');
    }
};
