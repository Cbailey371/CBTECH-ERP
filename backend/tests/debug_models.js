const { User, sequelize } = require('../models');

async function test() {
    try {
        console.log('Intentando autenticar conexión...');
        await sequelize.authenticate();
        console.log('Conexión exitosa.');

        console.log('Buscando usuario admin...');
        const user = await User.findOne({ where: { username: 'admin' } });
        if (user) {
            console.log('Usuario encontrado:', user.username);
            console.log('Rol:', user.role);
        } else {
            console.log('Usuario admin no encontrado.');
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await sequelize.close();
    }
}

test();
