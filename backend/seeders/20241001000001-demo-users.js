'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@erp.com',
        password: hashedPassword,
        first_name: 'Administrador',
        last_name: 'Sistema',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'usuario',
        email: 'usuario@erp.com',
        password: hashedPassword,
        first_name: 'Usuario',
        last_name: 'Demo',
        role: 'user',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        username: 'manager',
        email: 'manager@erp.com',
        password: hashedPassword,
        first_name: 'Gerente',
        last_name: 'General',
        role: 'manager',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};