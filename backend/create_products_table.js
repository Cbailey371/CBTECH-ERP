const { sequelize, Product } = require('./models');

async function createTable() {
    try {
        await sequelize.authenticate();
        console.log('Conexión exitosa.');

        await Product.sync({ alter: true });
        console.log('Tabla Products sincronizada.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTable();
