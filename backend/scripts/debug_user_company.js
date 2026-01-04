const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize, User, Company, UserCompany } = require('../models');

async function debugUserCompany() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Find testadmin
        const email = 'testadmin@example.com';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`User ${email} NOT FOUND.`);
            return;
        }
        console.log(`User found: ${user.email} (ID: ${user.id})`);

        // Check Company 1
        const companyId = 1;
        const company = await Company.findByPk(companyId);
        if (!company) {
            console.log(`Company ${companyId} NOT FOUND.`);
        } else {
            console.log(`Company found: ${company.name} (Active: ${company.isActive})`);
        }

        // Check Association
        const userCompany = await UserCompany.findOne({
            where: {
                userId: user.id,
                companyId: companyId
            }
        });

        if (userCompany) {
            console.log('UserCompany Association FOUND:', JSON.stringify(userCompany.toJSON(), null, 2));
        } else {
            console.log('UserCompany Association NOT FOUND.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

debugUserCompany();
