'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Obtener IDs de usuarios y empresas existentes
    const users = await queryInterface.sequelize.query(
      'SELECT id, email FROM users WHERE email IN (\'admin@erp.com\', \'usuario@erp.com\')',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const companies = await queryInterface.sequelize.query(
      'SELECT id, name FROM companies LIMIT 2',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length > 0 && companies.length > 0) {
      const adminUser = users.find(u => u.email === 'admin@erp.com');
      const regularUser = users.find(u => u.email === 'usuario@erp.com');

      const userCompanies = [];

      // Asignar admin a todas las empresas como admin
      if (adminUser) {
        companies.forEach(company => {
          userCompanies.push({
            user_id: adminUser.id,
            company_id: company.id,
            role: 'admin',
            is_active: true,
            is_default: companies.indexOf(company) === 0, // Primera empresa como default
            assigned_by: adminUser.id,
            assigned_at: new Date(),
            created_at: new Date(),
            updated_at: new Date()
          });
        });
      }

      // Asignar usuario regular a la primera empresa como user
      if (regularUser && companies.length > 0) {
        userCompanies.push({
          user_id: regularUser.id,
          company_id: companies[0].id,
          role: 'user',
          is_active: true,
          is_default: true,
          assigned_by: adminUser ? adminUser.id : regularUser.id,
          assigned_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
      }

      if (userCompanies.length > 0) {
        await queryInterface.bulkInsert('user_companies', userCompanies);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('user_companies', null, {});
  }
};