const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const Project = require('../models/Project');
const Contract = require('../models/Contract');
const Customer = require('../models/Customer');
const Quotation = require('../models/Quotation');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const companyId = 1;

        const customerCount = await Customer.count({ where: { companyId } });
        console.log(`Customers for Company ${companyId}: ${customerCount}`);

        const customerActiveCount = await Customer.count({ where: { companyId, isActive: true } });
        console.log(`Active Customers for Company ${companyId}: ${customerActiveCount}`);

        const projectCount = await Project.count({ where: { companyId } });
        console.log(`Projects for Company ${companyId}: ${projectCount}`);

        const contractCount = await Contract.count({ where: { companyId } });
        console.log(`Contracts for Company ${companyId}: ${contractCount}`);

        const quotationCount = await Quotation.count({ where: { companyId } });
        console.log(`Quotations for Company ${companyId}: ${quotationCount}`);
        const quotesByStatus = await Quotation.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            where: { companyId },
            group: ['status']
        });
        console.log('Quotes by Status:', JSON.stringify(quotesByStatus, null, 2));

        const projectsByStatus = await Project.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            where: { companyId },
            group: ['status']
        });
        console.log('Projects by Status:', JSON.stringify(projectsByStatus, null, 2));

        const contractsByStatus = await Contract.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            where: { companyId },
            group: ['status']
        });
        console.log('Contracts by Status:', JSON.stringify(contractsByStatus, null, 2));

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await sequelize.close();
    }
}

checkData();
