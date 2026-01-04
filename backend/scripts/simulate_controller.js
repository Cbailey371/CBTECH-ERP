const { sequelize, SalesOrder } = require('../models');
const salesOrderController = require('../controllers/salesOrderController');

async function simulate() {
    try {
        await sequelize.authenticate();

        // 1. Get a company ID from a fulfilled order
        const order = await SalesOrder.findOne({
            where: { status: 'fulfilled' }
        });

        if (!order) {
            console.log('No fulfilled order found to test with.');
            process.exit(0);
        }

        const companyId = order.companyId;
        console.log(`Testing with Company ID: ${companyId}`);

        // 2. Mock Request and Response
        const req = {
            query: {
                status: 'fulfilled',
                limit: '100'
            },
            user: {
                companyId: companyId
            }
        };

        const res = {
            json: (data) => {
                console.log('Controller Response:');
                console.log(JSON.stringify(data, null, 2));
            },
            status: (code) => {
                console.log(`Status Code: ${code}`);
                return res; // chainable
            }
        };

        // 3. Call Controller
        await salesOrderController.getOrders(req, res);

        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

simulate();
