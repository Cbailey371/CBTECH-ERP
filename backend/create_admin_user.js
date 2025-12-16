const { sequelize, User } = require('./models');

async function createAdmin() {
    try {
        await sequelize.authenticate();
        console.log('Conexión exitosa.');

        // Usamos texto plano, el modelo se encarga de hashear
        const plainPassword = 'admin123';

        const [user, created] = await User.findOrCreate({
            where: { username: 'admin' },
            defaults: {
                email: 'admin@erp.com',
                password: plainPassword,
                firstName: 'Admin',
                lastName: 'Test',
                role: 'admin',
                isActive: true
            }
        });

        if (created) {
            console.log('Usuario admin creado.');
        } else {
            console.log('Usuario admin ya existía. Actualizando password...');
            user.password = plainPassword;
            user.isActive = true;
            await user.save();
            console.log('Usuario admin actualizado.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin();
