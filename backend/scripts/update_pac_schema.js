const { sequelize } = require('../config/database');

async function updateSchema() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        const queryInterface = sequelize.getQueryInterface();

        // Add test_url column
        try {
            await queryInterface.addColumn('pac_providers', 'test_url', {
                type: sequelize.Sequelize.STRING,
                allowNull: true
            });
            console.log('✅ Added test_url column');
        } catch (e) {
            console.log('ℹ️ test_url column might already exist:', e.message);
        }

        // Add prod_url column
        try {
            await queryInterface.addColumn('pac_providers', 'prod_url', {
                type: sequelize.Sequelize.STRING,
                allowNull: true
            });
            console.log('✅ Added prod_url column');
        } catch (e) {
            console.log('ℹ️ prod_url column might already exist:', e.message);
        }

        // Add auth_type column with ENUM
        try {
            // First create the enum type if it doesn't exist (manual raw query for safety in Postgres)
            await sequelize.query(`
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_pac_providers_auth_type') THEN
                        CREATE TYPE "enum_pac_providers_auth_type" AS ENUM ('API_KEY', 'USER_PASS', 'OAUTH');
                    END IF;
                END$$;
            `);

            await queryInterface.addColumn('pac_providers', 'auth_type', {
                type: "enum_pac_providers_auth_type", // Use the name of the type directly for Postgres
                defaultValue: 'API_KEY'
            });
            console.log('✅ Added auth_type column');
        } catch (e) {
            console.log('ℹ️ auth_type column might already exist or enum error:', e.message);

            // Fallback: try adding it as string if enum fails complexity
            if (e.message.includes('already exists')) {
                // Ignore
            } else {
                try {
                    await queryInterface.addColumn('pac_providers', 'auth_type', {
                        type: sequelize.Sequelize.STRING,
                        defaultValue: 'API_KEY'
                    });
                    console.log('⚠️ Added auth_type as STRING (fallback)');
                } catch (ex) {
                    console.log('❌ Failed fallback:', ex.message);
                }
            }
        }

        console.log('🎉 Schema update completed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema();
