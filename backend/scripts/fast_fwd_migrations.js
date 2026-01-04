const { Sequelize } = require('sequelize');
const config = require('../config/config.js');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
});

const migrationsToMark = [
    '20251010000000-create-suppliers.js',
    '20251010000001-create-projects.js',
    '20251010000002-create-contracts.js',
    '20251010000003-create-tasks.js',
    '20251010000004-create-purchase-orders.js',
    '20251010000005-create-purchase-order-items.js',
    '20251216000000-add-code-to-users.js',
    '20251216000001-add-code-to-companies.js',
    '20251216000002-fix-customers-schema.js',
    '20251216000003-fix-products-schema.js',
    '20251216000004-fix-quotations-schema.js',
    '20251216000005-create-quotation-items.js',
    '20251216000006-add-project-id-to-contracts.js',
    '20251216000007-backfill-company-codes.js',
    '20260104000000-fepa-schema-update.js',
    '20260104000001-add-discount-fields-to-sales-orders.js'
];

async function run() {
    try {
        for (const name of migrationsToMark) {
            try {
                await sequelize.query(`INSERT INTO "SequelizeMeta" (name) VALUES ('${name}')`);
                console.log(`Marked ${name} as done.`);
            } catch (e) {
                if (e.message.includes('duplicate key value')) {
                    console.log(`${name} already marked.`);
                } else {
                    console.error(`Error marking ${name}:`, e.message);
                }
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

run();
