const { sequelize } = require('../config/database');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Migrating contracts table...');

        // 1. Add customer_id
        try {
            await sequelize.query(`ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "customer_id" INTEGER REFERENCES "customers"("id") ON DELETE SET NULL;`);
        } catch (e) { console.log('customer_id error or exists:', e.message); }

        // 2. Add billing_cycle
        try {
            // Try check if type exists first or just create
            await sequelize.query(`DO $$ BEGIN
                CREATE TYPE "enum_contracts_billing_cycle" AS ENUM ('monthly', 'quarterly', 'yearly', 'one_time');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;`);
            await sequelize.query(`ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "billing_cycle" "enum_contracts_billing_cycle" DEFAULT 'monthly';`);
        } catch (e) { console.log('billing_cycle error:', e.message); }

        // 3. Add sla_details
        try {
            await sequelize.query(`ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "sla_details" TEXT;`);
        } catch (e) { console.log('sla_details error:', e.message); }

        // 4. Add renewal_type
        try {
            await sequelize.query(`DO $$ BEGIN
                CREATE TYPE "enum_contracts_renewal_type" AS ENUM ('manual', 'auto');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;`);
            await sequelize.query(`ALTER TABLE "contracts" ADD COLUMN IF NOT EXISTS "renewal_type" "enum_contracts_renewal_type" DEFAULT 'manual';`);
        } catch (e) { console.log('renewal_type error:', e.message); }

        // 5. Update Status Enum
        // Note: 'terminated' exists. We need 'suspended' and 'cancelled'.
        const statuses = ['suspended', 'cancelled'];
        for (const status of statuses) {
            try {
                await sequelize.query(`ALTER TYPE "enum_contracts_status" ADD VALUE IF NOT EXISTS '${status}';`);
            } catch (e) {
                // Fallback for older Postgres which doesn't support IF NOT EXISTS in ADD VALUE
                // Verify if it fails because it exists
                console.log(`Status ${status} add error (might exist):`, e.message);
            }
        }

        console.log('Migration done.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}
migrate();
