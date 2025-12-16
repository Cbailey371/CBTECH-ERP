const { sequelize, User, Role } = require('./models');

async function test() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const users = await User.findAll({ limit: 1 });
        console.log('Users found:', users.length);

        const roles = await Role.findAll({ limit: 1 });
        console.log('Roles found:', roles.length);

        console.log('Models seem OK.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

test();
