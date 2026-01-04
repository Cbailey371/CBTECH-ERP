'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            const tableInfo = await queryInterface.describeTable('sales_orders');

            if (!tableInfo.discount) {
                await queryInterface.addColumn('sales_orders', 'discount', {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0
                }, { transaction });
            }

            if (!tableInfo.discount_type) {
                await queryInterface.addColumn('sales_orders', 'discount_type', {
                    type: Sequelize.ENUM('percentage', 'amount'),
                    allowNull: false,
                    defaultValue: 'amount'
                }, { transaction });
            }

            if (!tableInfo.discount_value) {
                await queryInterface.addColumn('sales_orders', 'discount_value', {
                    type: Sequelize.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0
                }, { transaction });
            }

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    },

    async down(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            const tableInfo = await queryInterface.describeTable('sales_orders');

            if (tableInfo.discount_value) {
                await queryInterface.removeColumn('sales_orders', 'discount_value', { transaction });
            }

            if (tableInfo.discount_type) {
                await queryInterface.removeColumn('sales_orders', 'discount_type', { transaction });
                await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_sales_orders_discount_type";', { transaction });
            }

            if (tableInfo.discount) {
                await queryInterface.removeColumn('sales_orders', 'discount', { transaction });
            }

            await transaction.commit();
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    }
};
