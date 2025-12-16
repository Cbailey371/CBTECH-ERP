'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Create Default Company if it doesn't exist
        const companies = await queryInterface.sequelize.query(
            "SELECT id FROM companies WHERE tax_id = '8-888-8888' LIMIT 1",
            { type: Sequelize.QueryTypes.SELECT }
        );

        let companyId;

        if (companies.length === 0) {
            const [newCompanyId] = await queryInterface.bulkInsert('companies', [{
                name: 'CBTECH ERP Demo',
                legal_name: 'CBTECH ERP Demo S.A.',
                tax_id: '8-888-8888',
                tax_id_type: 'RUC',
                email: 'info@cbtech.com',
                phone: '222-2222',
                address_line1: 'Ciudad de Panamá',
                city: 'Panamá',
                country: 'Panamá',
                tax_regime: 'ORDINARY',
                taxpayer_type: 'JURIDICA',
                default_currency: 'USD',
                timezone: 'America/Panama',
                fiscal_year_start: '01-01',
                is_main_company: true,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date()
            }], { returning: ['id'] });

            // Handle PostgreSQL returning array of objects or just ID depending on version/config
            // bulkInsert with returning returns an array of the inserted objects or their IDs
            // Safe way is to query it back if uncertain, but usually it returns user object

            // Let's query it back to be 100% safe across dialects
            const createdCompany = await queryInterface.sequelize.query(
                "SELECT id FROM companies WHERE tax_id = '8-888-8888' LIMIT 1",
                { type: Sequelize.QueryTypes.SELECT }
            );
            companyId = createdCompany[0].id;
        } else {
            companyId = companies[0].id;
        }

        // 2. Assign Admin to Company
        const users = await queryInterface.sequelize.query(
            "SELECT id FROM users WHERE username = 'admin' OR email = 'admin@erp.com' LIMIT 1",
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (users.length > 0) {
            const adminId = users[0].id;

            const existingAssociation = await queryInterface.sequelize.query(
                `SELECT id FROM user_companies WHERE user_id = ${adminId} AND company_id = ${companyId}`,
                { type: Sequelize.QueryTypes.SELECT }
            );

            if (existingAssociation.length === 0) {
                await queryInterface.bulkInsert('user_companies', [{
                    user_id: adminId,
                    company_id: companyId,
                    role: 'admin',
                    is_active: true,
                    is_default: true,
                    assigned_by: adminId, // Self-assigned
                    assigned_at: new Date(),
                    created_at: new Date(),
                    updated_at: new Date()
                }]);
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // Optional: Delete created company and association
        // Ideally we don't want to delete data in production down migration easily
    }
};
