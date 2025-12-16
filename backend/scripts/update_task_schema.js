const { sequelize } = require('../config/database');

async function migrate() {
    try {
        console.log('Iniciando migración de Tareas...');
        await sequelize.authenticate();

        // Check if column exists
        const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='tasks' AND column_name='external_responsible_name';
    `);

        if (results.length === 0) {
            console.log('Agregando columna external_responsible_name...');
            await sequelize.query(`
        ALTER TABLE "tasks" 
        ADD COLUMN "external_responsible_name" VARCHAR(255) DEFAULT NULL;
      `);
            console.log('Columna agregada exitosamente.');
        } else {
            console.log('La columna external_responsible_name ya existe.');
        }

    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
