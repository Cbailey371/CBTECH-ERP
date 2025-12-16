require('dotenv').config({ path: '../.env' }); // Adjust path if running from backend root
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configuration
const dbConfig = require('../config/config.js');
const env = process.env.NODE_ENV || 'production';
const config = dbConfig[env];

console.log(`Using environment: ${env}`);
console.log(`Database: ${config.database} on ${config.host}`);

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: console.log
});

async function fixCompanyCodes() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // 1. Find companies without code
        const [results] = await sequelize.query(
            "SELECT id, name FROM companies WHERE code IS NULL OR code = ''"
        );

        if (results.length === 0) {
            console.log('✅ No companies found without code. Everything looks good!');
            return;
        }

        console.log(`Found ${results.length} companies without code.`);

        // 2. Find last used code
        const [maxCodeResult] = await sequelize.query(
            "SELECT code FROM companies WHERE code LIKE 'EMP-%' ORDER BY code DESC LIMIT 1"
        );

        let nextNum = 1;
        if (maxCodeResult.length > 0 && maxCodeResult[0].code) {
            const match = maxCodeResult[0].code.match(/EMP-(\d+)/);
            if (match) nextNum = parseInt(match[1]) + 1;
        }

        // 3. Update companies
        for (const company of results) {
            const newCode = `EMP-${String(nextNum).padStart(3, '0')}`;
            console.log(`Updating company "${company.name}" (ID: ${company.id}) -> ${newCode}`);

            await sequelize.query(
                "UPDATE companies SET code = :code WHERE id = :id",
                {
                    replacements: { code: newCode, id: company.id }
                }
            );
            nextNum++;
        }

        console.log('🎉 Update complete!');

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

fixCompanyCodes();
