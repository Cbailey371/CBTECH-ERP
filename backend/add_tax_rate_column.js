const { sequelize } = require('./models');

async function addColumn() {
    try {
        await sequelize.authenticate();
        console.log('Conexión exitosa.');

        await sequelize.query('ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0.07;');
        console.log('Columna tax_rate agregada.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addColumn();
