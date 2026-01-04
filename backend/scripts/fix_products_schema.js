const { sequelize } = require('../config/database');

async function fixProductsSchema() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Check if column exists, if not add it
        try {
            await sequelize.query(`ALTER TABLE "products" ADD COLUMN "name" VARCHAR(200);`);
            console.log('Added "name" column to products table.');
        } catch (error) {
            if (error.original && error.original.code === '42701') {
                console.log('"name" column already exists.');
            } else {
                throw error;
            }
        }

        // 2. Backfill name from description if name is null
        await sequelize.query(`UPDATE "products" SET "name" = "description" WHERE "name" IS NULL;`);
        console.log('Backfilled "name" column from "description".');

        process.exit(0);
    } catch (error) {
        console.error('Error fixing products schema:', error);
        process.exit(1);
    }
}

fixProductsSchema();
