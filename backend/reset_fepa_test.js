const { 
    FE_Document, SalesOrder, SalesOrderItem, 
    Payment, CreditNote, DeliveryNote, DeliveryNoteItem, 
    sequelize 
} = require('./models');

async function totalWipeOut() {
    const t = await sequelize.transaction();
    try {
        console.log('🚀 INICIANDO PURGA TOTAL DE FACTURACÍON Y VENTAS...');

        // 1. Dependencias directas de SalesOrder
        console.log('   🗑️  Eliminando documentos fiscales (FE_Document)...');
        await FE_Document.destroy({ where: {}, force: true, transaction: t });

        console.log('   🗑️  Eliminando Notas de Crédito...');
        await CreditNote.destroy({ where: {}, force: true, transaction: t });

        console.log('   🗑️  Eliminando Pagos/Cobros (Payments)...');
        await Payment.destroy({ where: {}, force: true, transaction: t });

        // 2. Guías de remisión (Delivery Notes) y sus ítems
        console.log('   🗑️  Eliminando Guías de Entrega (DeliveryNotes)...');
        await DeliveryNoteItem.destroy({ where: {}, force: true, transaction: t });
        await DeliveryNote.destroy({ where: {}, force: true, transaction: t });

        // 3. Ítems de las Órdenes de Venta
        console.log('   🗑️  Eliminando Ítems de Ventas (SalesOrderItems)...');
        await SalesOrderItem.destroy({ where: {}, force: true, transaction: t });

        // 4. Órdenes de Venta (SalesOrders)
        console.log('   🗑️  Eliminando Órdenes de Venta (SalesOrders)...');
        await SalesOrder.destroy({ where: {}, force: true, transaction: t });

        await t.commit();
        console.log('\n✅ ÉXITO: El sistema ha sido purgado por completo.');
        console.log('   Todas las facturas, ventas y cobros han sido eliminados.');
        process.exit(0);
    } catch (error) {
        await t.rollback();
        console.error('\n❌ ERROR CRÍTICO durante la purga:', error);
        process.exit(1);
    }
}

console.log('⚠️  PELIGRO: ESTA ACCIÓN ES IRREVERSIBLE.');
console.log('   Se eliminará TODO el historial de ventas y facturación en 3 segundos...');

setTimeout(totalWipeOut, 3000);
