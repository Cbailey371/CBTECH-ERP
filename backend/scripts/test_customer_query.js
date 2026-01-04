const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Sequelize, Op } = require('sequelize');
const config = require('../config/config.js')['development'];
const Customer = require('../models/Customer');

async function testQuery() {
    try {
        const sequelize = new Sequelize(config.database, config.username, config.password, {
            host: config.host,
            dialect: config.dialect,
            logging: console.log
        });

        const whereClause = { companyId: 1 };

        console.log('Running findAndCountAll with order by created_at...');
        const { count, rows } = await Customer.findAndCountAll({
            where: whereClause,
            limit: 10,
            offset: 0,
            order: [['created_at', 'DESC']]
        });

        console.log('Success!', count);
        console.log('Rows:', rows.length);

    } catch (error) {
        console.error('Query Failed:', error.message);
        console.error('Detail:', error);
    }
}

testQuery();
