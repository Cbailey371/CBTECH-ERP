const { FE_Document, SalesOrder, Payment, CreditNote, sequelize } = require('./models');

async function resetFepaTests() {
    const t = await sequelize.transaction();
    try {
        console.log('🚀 Iniciando limpieza total de historial de facturación...');

        // 1. Borrar documentos electrónicos (FE_Document)
        console.log('   🗑️  Eliminando registros de fiscalización (FE_Document)...');
        await FE_Document.destroy({ where: {}, force: true, transaction: t });

        // 2. Borrar Notas de Crédito
        console.log('   🗑️  Eliminando Notas de Crédito...');
        await CreditNote.destroy({ where: {}, force: true, transaction: t });

        // 3. Borrar Pagos (para que el balance de la orden de venta se restaure)
        console.log('   🗑️  Eliminando historial de cobros (Payments)...');
        await Payment.destroy({ where: {}, force: true, transaction: t });

        // 4. Resetear estados en SalesOrder
        console.log('   🔄 Restaurando estados de Órdenes de Venta...');
        // Ponemos todo como unpaid y balance = total
        await SalesOrder.update({
            paymentStatus: 'unpaid',
            paidAmount: 0,
            balance: sequelize.col('total'),
            // Opcional: si quieres resetear el status global a 'confirmed' para poder re-emitir
            status: 'confirmed' 
        }, { 
            where: {}, 
            transaction: t 
        });

        await t.commit();
        console.log('\n✨ ÉXITO: El sistema ha sido reseteado.');
        console.log('   Ahora puedes intentar emitir nuevas facturas de prueba.');
        process.exit(0);
    } catch (error) {
        await t.rollback();
        console.error('\n❌ ERROR durante el reset:', error);
        process.exit(1);
    }
}

// Advertencia de seguridad
console.log('⚠️  ATENCIÓN: Este script ELIMINARÁ permanentemente el historial de facturas y pagos.');
console.log('   Preparando ejecución en 2 segundos...');

setTimeout(resetFepaTests, 2000);
