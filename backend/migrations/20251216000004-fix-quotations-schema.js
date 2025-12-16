'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('quotations');

        // 1. Rename 'code' -> 'number'
        if (tableInfo.code && !tableInfo.number) {
            await queryInterface.renameColumn('quotations', 'code', 'number');
        }
        // Ensure correct type for number
        if (tableInfo.code || tableInfo.number) {
            // If we just renamed it, it's number now. If it was already number, it's number.
            // We want to ensure it is STRING(50) to match model.
            await queryInterface.changeColumn('quotations', 'number', {
                type: Sequelize.STRING(50),
                allowNull: false
            });
        }

        // 2. Rename 'issue_date' -> 'date'
        if (tableInfo.issue_date && !tableInfo.date) {
            await queryInterface.renameColumn('quotations', 'issue_date', 'date');
        }

        // 3. Rename 'expiration_date' -> 'valid_until'
        if (tableInfo.expiration_date && !tableInfo.valid_until) {
            await queryInterface.renameColumn('quotations', 'expiration_date', 'valid_until');
        }

        // 4. Rename 'tax_total' -> 'tax'
        if (tableInfo.tax_total && !tableInfo.tax) {
            await queryInterface.renameColumn('quotations', 'tax_total', 'tax');
        }

        // 5. Rename 'itbms_rate' -> 'tax_rate'
        if (tableInfo.itbms_rate && !tableInfo.tax_rate) {
            await queryInterface.renameColumn('quotations', 'itbms_rate', 'tax_rate');
        }

        // 6. Add 'discount'
        if (!tableInfo.discount) {
            await queryInterface.addColumn('quotations', 'discount', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            });
        }

        // 7. Add 'discount_type'
        if (!tableInfo.discount_type) {
            // Need to define ENUM type first if it doesn't exist? Postgres handles ENUMs as types.
            // Sequelize handles this automatically usually, but specifying inline is safer.
            await queryInterface.addColumn('quotations', 'discount_type', {
                type: Sequelize.ENUM('percentage', 'amount'),
                allowNull: false,
                defaultValue: 'amount'
            });
        }

        // 8. Add 'discount_value'
        if (!tableInfo.discount_value) {
            await queryInterface.addColumn('quotations', 'discount_value', {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            });
        }
    },

    async down(queryInterface, Sequelize) {
        const tableInfo = await queryInterface.describeTable('quotations');

        if (tableInfo.number) await queryInterface.renameColumn('quotations', 'number', 'code');
        if (tableInfo.date) await queryInterface.renameColumn('quotations', 'date', 'issue_date');
        if (tableInfo.valid_until) await queryInterface.renameColumn('quotations', 'valid_until', 'expiration_date');
        if (tableInfo.tax) await queryInterface.renameColumn('quotations', 'tax', 'tax_total');
        if (tableInfo.tax_rate) await queryInterface.renameColumn('quotations', 'tax_rate', 'itbms_rate');

        if (tableInfo.discount) await queryInterface.removeColumn('quotations', 'discount');
        if (tableInfo.discount_type) {
            await queryInterface.removeColumn('quotations', 'discount_type');
            await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quotations_discount_type";');
        }
        if (tableInfo.discount_value) await queryInterface.removeColumn('quotations', 'discount_value');
    }
};
