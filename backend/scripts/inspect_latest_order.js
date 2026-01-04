const { sequelize, SalesOrder, SalesOrderItem, Customer } = require('../models');

async function inspectOrder() {
    try {
        await sequelize.authenticate();

        // Find latest order
        const order = await SalesOrder.findOne({
            order: [['id', 'DESC']],
            include: [
                { model: Customer, as: 'customer' },
                { model: SalesOrderItem, as: 'items' }
            ]
        });

        if (!order) {
            console.log('No orders found.');
        } else {
            console.log('Order Found:', JSON.stringify(order.toJSON(), null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

inspectOrder();
