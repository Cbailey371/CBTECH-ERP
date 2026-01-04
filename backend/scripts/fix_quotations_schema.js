const { sequelize } = require('../config/database');

async function fixSchema() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        // Fix Quotations: Add sequence column if not exists
        try {
            await sequelize.query('ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sequence INTEGER;');
            console.log('Added sequence column to quotations.');
        } catch (e) {
            console.log('Error adding sequence column (might already exist):', e.message);
        }

        // Fix Quotations: Create index
        try {
            await sequelize.query('CREATE UNIQUE INDEX IF NOT EXISTS quotations_company_id_sequence ON quotations (company_id, sequence);');
            console.log('Created index quotations_company_id_sequence.');
        } catch (e) {
            console.log('Error creating index:', e.message);
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

fixSchema();
