const { Quotation, QuotationItem, Customer } = require('./models');

async function testQuery() {
    try {
        console.log('Testing Quotation findOne with order...');
        const quotation = await Quotation.findOne({
            include: [
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: QuotationItem,
                    as: 'items'
                }
            ],
            order: [
                [{ model: QuotationItem, as: 'items' }, 'position', 'ASC']
            ]
        });
        console.log('Success! Quotation found.');
        if (quotation && quotation.items) {
            console.log('Items found:', quotation.items.length);
        }
    } catch (error) {
        console.error('Error in query:', error);
    } finally {
        process.exit();
    }
}

testQuery();
