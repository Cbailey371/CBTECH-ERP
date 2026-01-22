const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize } = require('sequelize');
const config = require('../config/config.js')['development'];
const Customer = require('../models/Customer');
const Company = require('../models/Company');

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    dialect: config.dialect,
    logging: false
});

async function checkCustomers() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // Define associations if not already loaded (though Models usually do this)
        // Just raw query might be safer if models have issues, but let's try Model first?
        // Actually, Customer model is required.

        const count = await Customer.count({ where: { companyId: 1 } });
        console.log(`Customers count for Company 1: ${count}`);

        const customers = await Customer.findAll({
            where: { companyId: 1 },
            limit: 5,
            attributes: ['id', 'code', 'name', 'isActive']
        });

        console.log('Sample Customers:', JSON.stringify(customers, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkCustomers();
