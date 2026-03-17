'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('fe_documents', 'credit_note_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'credit_notes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add index for performance
    await queryInterface.addIndex('fe_documents', ['credit_note_id'], {
      name: 'fe_documents_credit_note_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('fe_documents', 'fe_documents_credit_note_idx');
    await queryInterface.removeColumn('fe_documents', 'credit_note_id');
  }
};
