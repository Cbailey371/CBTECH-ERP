const { sequelize, Quotation, QuotationItem } = require('../models');

async function inspectQuotation() {
    try {
        await sequelize.authenticate();

        const quotation = await Quotation.findByPk(42, {
            include: [{ model: QuotationItem, as: 'items' }]
        });

        if (!quotation) {
            console.log('Quotation 42 not found.');
        } else {
            console.log('Quotation 42 Items:', JSON.stringify(quotation.items, null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspectQuotation();
