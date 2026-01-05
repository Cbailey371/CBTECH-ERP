const { sequelize, Customer, SalesOrder } = require('./models');
const { Op } = require('sequelize');

async function debugStatement() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Mock Data - Adjust IDs as needed based on your DB content
        const companyId = 1;
        const customerId = 12; // From previous context I recall customer 12

        console.log(`Debug GetStatement for Company: ${companyId}, Customer: ${customerId}`);

        const customer = await Customer.findOne({
            where: { id: customerId, company_id: companyId } // Note: using company_id field name directly to be safe? Or attribute?
            // Model uses attribute companyId mapped to field company_id. 
            // In where clause, we usually use attribute name 'companyId'.
        });

        if (!customer) {
            console.error('Customer not found');
            return;
        }
        console.log('Customer found:', customer.name);

        const unpaidInvoices = await SalesOrder.findAll({
            where: {
                companyId: companyId,
                customerId: customerId,
                balance: { [Op.gt]: 0 },
                status: { [Op.notIn]: ['cancelled', 'draft'] }
            },
            order: [['issueDate', 'ASC']]
        });

        console.log(`Found ${unpaidInvoices.length} unpaid invoices.`);
        unpaidInvoices.forEach(inv => {
            console.log(`- Invoice ${inv.orderNumber}: Balance ${inv.balance}`);
        });

    } catch (error) {
        console.error('CRITICAL ERROR:', error);
    } finally {
        await sequelize.close();
    }
}

debugStatement();
