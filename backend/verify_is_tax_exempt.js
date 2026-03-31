const { Customer, Product } = require('./models');

async function verifyPersistence() {
    console.log('🧪 VERIFICANDO PERSISTENCIA DE isTaxExempt');
    const companyId = 1;

    try {
        // 1. Cliente: Parlamento Lat
        console.log('--- CLIENTE ---');
        let customer = await Customer.findOne({ where: { name: 'Parlamento Lat', companyId } });
        if (customer) {
            console.log(`   Estado actual isTaxExempt: ${customer.isTaxExempt}`);
            
            // Simular actualización (Lo hacemos directo en el modelo para verificar el campo, 
            // pero como ya lo probamos en el controlador, esto valida el esquema y los hooks)
            await customer.update({ isTaxExempt: true });
            
            // Recargar
            await customer.reload();
            console.log(`   Estado después de Update: ${customer.isTaxExempt}`);
            
            if (customer.isTaxExempt === true) {
                console.log('   ✅ Persistencia en CLIENTE exitosa.');
            } else {
                console.log('   ❌ FALLO persistencia en CLIENTE.');
            }
        }

        // 2. Producto: Seleccionar uno cualquiera
        console.log('\n--- PRODUCTO ---');
        let product = await Product.findOne({ where: { companyId } });
        if (product) {
            console.log(`   Producto: ${product.description}`);
            console.log(`   Estado actual isTaxExempt: ${product.isTaxExempt}`);
            
            await product.update({ isTaxExempt: true });
            await product.reload();
            
            console.log(`   Estado después de Update: ${product.isTaxExempt}`);
            if (product.isTaxExempt === true) {
                console.log('   ✅ Persistencia en PRODUCTO exitosa.');
            } else {
                console.log('   ❌ FALLO persistencia en PRODUCTO.');
            }
        } else {
            console.log('   ⚠️ No se encontraron productos para probar.');
        }

    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
    }
    process.exit();
}

verifyPersistence();
