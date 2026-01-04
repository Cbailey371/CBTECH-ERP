const { sequelize } = require('../config/database');

async function addInvoicedStatus() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Raw SQL to add value to enum (PostgreSQL specific)
        // Check if value exists first to avoid error
        try {
            await sequelize.query(`ALTER TYPE "enum_quotations_status" ADD VALUE 'invoiced';`);
            console.log("Added 'invoiced' to enum_quotations_status.");
        } catch (error) {
            if (error.original && error.original.code === '42710') {
                console.log("'invoiced' already exists in enum.");
            } else {
                throw error;
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error adding enum value:', error);
        process.exit(1);
    }
}

addInvoicedStatus();
