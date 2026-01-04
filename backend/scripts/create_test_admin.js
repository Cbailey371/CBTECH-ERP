const { sequelize, User, Company, UserCompany } = require('../models');

async function createTestUser() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Create User
        const [user, created] = await User.findOrCreate({
            where: { email: 'testadmin@example.com' },
            defaults: {
                username: 'testadmin',
                password: 'password123', // Hook will hash it
                email: 'testadmin@example.com',
                firstName: 'Test',
                lastName: 'Admin',
                role: 'admin',
                isActive: true
            }
        });

        if (created) {
            console.log('User created:', user.email);
        } else {
            console.log('User already exists:', user.email);
            // Update password just in case
            user.password = 'password123';
            await user.save();
        }

        // Ensure Company 1 exists
        let company = await Company.findByPk(1);
        if (!company) {
            company = await Company.create({
                name: 'Test Company',
                legalName: 'Test Company S.A.',
                taxId: '999-999-999',
                isActive: true
            });
            console.log('Created Company 1');
        }

        // Assign User to Company
        await UserCompany.findOrCreate({
            where: { userId: user.id, companyId: 1 },
            defaults: {
                role: 'admin',
                permissions: ['all'],
                isActive: true,
                isDefault: true
            }
        });
        console.log('User assigned to company');

        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
}

createTestUser();
