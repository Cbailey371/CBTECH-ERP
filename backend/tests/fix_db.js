const { sequelize } = require('../config/database');

async function fix() {
    try {
        console.log('Conectando a la base de datos...');
        await sequelize.authenticate();

        console.log('Eliminando tabla quotation_items...');
        await sequelize.query('DROP TABLE IF EXISTS "quotation_items" CASCADE');

        console.log('Eliminando tabla quotations...');
        await sequelize.query('DROP TABLE IF EXISTS "quotations" CASCADE');

        console.log('✅ Tablas eliminadas. El servidor las recreará al iniciar.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fix();
