const { SalesOrder } = require('./models');

async function fixBalances() {
    try {
        const orders = await SalesOrder.findAll({
            where: {
                balance: 0,
                paidAmount: 0,
                status: ['fulfilled', 'confirmed', 'draft']
            }
        });

        console.log(`Encontradas ${orders.length} facturas con saldo 0 sin pagos.`);
        
        for (const order of orders) {
            if (parseFloat(order.total) > 0) {
                console.log(`Corrigiendo factura ${order.orderNumber}: Total ${order.total} -> Balance ${order.total}`);
                await order.update({ balance: order.total });
            }
        }
        
        console.log('Corrección finalizada.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixBalances();
