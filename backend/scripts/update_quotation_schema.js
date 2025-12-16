const { sequelize } = require('../config/database');

async function migrate() {
    try {
        console.log('Iniciando migración manual...');
        await sequelize.authenticate();

        // Check if column exists
        const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='quotation_items' AND column_name='product_id';
    `);

        if (results.length === 0) {
            console.log('Agregando columna product_id...');
            await sequelize.query(`
        ALTER TABLE "quotation_items" 
        ADD COLUMN "product_id" INTEGER REFERENCES "products" ("id") ON DELETE SET NULL;
      `);
            console.log('Columna agregada exitosamente.');
        } else {
            console.log('La columna product_id ya existe.');
        }

    } catch (error) {
        console.error('Error durante la migración:', error);
    } finally {
        await sequelize.close();
    }
}

migrate();
