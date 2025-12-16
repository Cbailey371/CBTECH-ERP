const { sequelize } = require('../config/database');

async function addCodeColumn() {
    const tables = [
        'contracts',
        'suppliers',
        'projects',
        'tasks',
        'customers',
        'companies',
        'users'
    ];

    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        for (const table of tables) {
            try {
                // Check if column exists
                const [results] = await sequelize.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='${table}' AND column_name='code';
                `);

                if (results.length === 0) {
                    console.log(`Adding 'code' column to ${table}...`);
                    await sequelize.query(`ALTER TABLE "${table}" ADD COLUMN "code" VARCHAR(50);`);
                    console.log(`✅ 'code' column added to ${table}`);
                } else {
                    console.log(`ℹ️  'code' column already exists in ${table}`);
                }
            } catch (err) {
                console.error(`❌ Error updating ${table}:`, err.message);
            }
        }

        console.log('Migration completed.');
        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

addCodeColumn();
