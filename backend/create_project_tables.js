const { sequelize } = require('./models');
const { Project, Task } = require('./models');

async function createTables() {
    try {
        await sequelize.authenticate();
        console.log('Conexión exitosa.');

        await Project.sync({ alter: true });
        console.log('Tabla Projects sincronizada.');

        await Task.sync({ alter: true });
        console.log('Tabla Tasks sincronizada.');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTables();
