const { sequelize, SalesOrder, SalesOrderItem } = require('../models');

async function checkOrder(id) {
    try {
        await sequelize.authenticate();

        const order = await SalesOrder.findOne({
            where: { id },
            include: [{ model: SalesOrderItem, as: 'items' }]
        });

        if (!order) {
            console.log(`Order ${id} not found`);
            return;
        }

        console.log(`--- Order ${order.orderNumber} (ID: ${order.id}) ---`);
        console.log(`Expected (Header) -> Subtotal: ${order.subtotal}, Tax: ${order.taxTotal}, Total: ${order.total}`);

        let calculatedSub = 0;
        let calculatedTax = 0;

        console.log('Items:');
        order.items.forEach(item => {
            const total = parseFloat(item.total);
            const qty = parseFloat(item.quantity);
            const price = parseFloat(item.unitPrice);
            // Re-calculate line totals
            const lineSub = qty * price;
            // Note: DB 'total' often includes tax in some systems, or is just subtotal?
            // In SalesOrderController: lineSubtotal = (qty * price) - discount;
            // lineTax = lineSubtotal * taxRate;
            // total = lineSubtotal + lineTax;

            // Let's assume standard behavior and check values stored
            console.log(`- ${item.description}: Qty ${item.quantity} * ${item.unitPrice} (Disc: ${item.discount}) = ${lineSub} (Stored Total: ${item.total})`);

            // We'll trust the stored 'total' for the "Items" sum for a moment, or re-calculate tax?
            // The controller stores `total` (gross).
            // Let's deduce subtotal/tax from item context if possible, or just sum them up.

            // Actually, let's look at `subtotal` field if it exists on item? 
            // Step 11892 (Controller) says: "subtotal: lineSubtotal" is stored in item. 
            // Let's check if 'subtotal' column exists on SalesOrderItem.
            // If not, we have to recalculate.

            calculatedSub += parseFloat(item.subtotal || (qty * price)); // Fallback
            // Tax?
            // Logic: lineTax = lineSubtotal * taxRate
            const taxRate = parseFloat(item.taxRate || 0.07);
            const lineTax = (parseFloat(item.subtotal || (qty * price)) * taxRate);
            calculatedTax += lineTax;
        });

        console.log(`Calculated (Sum Items) -> Subtotal: ${calculatedSub.toFixed(2)}, Tax: ${calculatedTax.toFixed(2)}, Total: ${(calculatedSub + calculatedTax).toFixed(2)}`);

    } catch (e) {
        console.error(e);
    }
}

(async () => {
    await checkOrder(23);
    await checkOrder(24); // Check another one too
    process.exit(0);
})();
