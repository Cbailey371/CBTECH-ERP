const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize, Customer } = require('../models');
const { Op } = require('sequelize');

async function testGetCustomers() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const companyId = 1; // Assuming Company 1
        const limit = 1000;
        const page = 1;
        const offset = (page - 1) * limit;

        const whereClause = {
            companyId: companyId,
            isActive: true
        };

        console.log('Querying customers for Company:', companyId);

        const { count, rows } = await Customer.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        console.log(`Found ${count} customers.`);
        if (rows.length > 0) {
            console.log('Sample Customer:', JSON.stringify(rows[0].toJSON(), null, 2));
        } else {
            console.log('No customers found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testGetCustomers();
