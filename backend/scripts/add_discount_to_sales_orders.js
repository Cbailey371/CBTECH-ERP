const { sequelize } = require('../config/database');

async function fixSalesOrderSchema() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const queryInterface = sequelize.getQueryInterface();

        // Add columns if they don't exist
        try {
            await sequelize.query(`ALTER TABLE "sales_orders" ADD COLUMN "discount" DECIMAL(10, 2) DEFAULT 0 NOT NULL;`);
            console.log('Added "discount" column.');
        } catch (e) { console.log('"discount" might already exist'); }

        try {
            await sequelize.query(`ALTER TABLE "sales_orders" ADD COLUMN "discount_type" VARCHAR(255) DEFAULT 'amount' NOT NULL;`);
            console.log('Added "discount_type" column.');
            // Note: In postgres enum is a type, but for simplicity taking varchar or we can create type.
            // Quotation uses ENUM('percentage', 'amount').
            // Let's try to use the existing type if possible or just varchar check constraint.
            // Actually, safely adding a column with a check is better or just using TEXT for simplicity in this hotfix if enum type is tricky.
            // But Quotation model uses `DataTypes.ENUM`.
        } catch (e) { console.log('"discount_type" might already exist'); }

        try {
            await sequelize.query(`ALTER TABLE "sales_orders" ADD COLUMN "discount_value" DECIMAL(10, 2) DEFAULT 0 NOT NULL;`);
            console.log('Added "discount_value" column.');
        } catch (e) { console.log('"discount_value" might already exist'); }

        process.exit(0);
    } catch (error) {
        console.error('Error fixing sales_orders schema:', error);
        process.exit(1);
    }
}

fixSalesOrderSchema();
