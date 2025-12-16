const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { Contract, Supplier, PurchaseOrder, Quotation, Customer } = require('../models');

async function checkQueries() {
    try {
        console.log('Testing Contracts Query...');
        await Contract.findAll({
            include: [{ model: Customer, as: 'customer', attributes: ['name'] }],
            limit: 1
        });
        console.log('✅ Contracts Query success.');
    } catch (error) {
        console.error('❌ Contracts Query failed:', error.message);
    }

    try {
        console.log('Testing Purchases Query...');
        await PurchaseOrder.findAll({
            include: [{ model: Supplier, as: 'supplier', attributes: ['name', 'email'] }],
            limit: 1
        });
        console.log('✅ Purchases Query success.');
    } catch (error) {
        console.error('❌ Purchases Query failed:', error.message);
    }

    try {
        console.log('Testing Sales Query...');
        await Quotation.findAll({
            include: [{ model: Customer, as: 'customer', attributes: ['name', 'email'] }],
            limit: 1
        });
        console.log('✅ Sales Query success.');
    } catch (error) {
        console.error('❌ Sales Query failed:', error.message);
    }

    process.exit(0);
}

checkQueries();
