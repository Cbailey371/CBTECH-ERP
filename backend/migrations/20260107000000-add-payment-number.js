'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        try {
            await queryInterface.addColumn('payments', 'payment_number', {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true
            });
        } catch (error) {
            console.log('Column payment_number likely already exists, proceeding...', error.message);
        }

        // Backfill existing records
        const payments = await queryInterface.sequelize.query(
            `SELECT id, date FROM payments ORDER BY id ASC`,
            { type: queryInterface.sequelize.QueryTypes.SELECT }
        );

        for (let i = 0; i < payments.length; i++) {
            const p = payments[i];
            const year = new Date(p.date).getFullYear();
            const code = `AB-${year}-${String(i + 1).padStart(4, '0')}`;

            await queryInterface.sequelize.query(
                `UPDATE payments SET payment_number = '${code}' WHERE id = ${p.id}`
            );
        }

        // Now make it not null if needed, but safer to leave nullable or enforce validation in app
        // await queryInterface.changeColumn('payments', 'payment_number', {
        //   type: Sequelize.STRING,
        //   allowNull: false
        // });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('payments', 'payment_number');
    }
};
