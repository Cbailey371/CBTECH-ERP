const API_URL = 'http://localhost:3000/api';
const AUTH_URL = `${API_URL}/auth/login`;
const PRODUCTS_URL = `${API_URL}/products`;

async function runTest() {
    console.log('🚀 Iniciando Prueba de Integración: Productos y Servicios');

    try {
        // 1. Login
        const loginRes = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        if (!loginRes.ok) throw new Error('Login failed');
        const { data: { token } } = await loginRes.json();
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-company-id': '1'
        };

        // 2. Crear Producto con Margen
        console.log('\n🧪 Prueba 1: Crear Producto con Cálculo de Precio');
        const cost = 100;
        const margin = 0.30;
        const expectedPrice = 142.86; // 100 / 0.7

        const prodRes = await fetch(PRODUCTS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'product',
                description: 'Producto Test Margen',
                code: `PROD-${Date.now()}`,
                cost: cost,
                margin: margin
            })
        });

        const prodData = await prodRes.json();
        if (!prodRes.ok) throw new Error(`Error creando producto: ${JSON.stringify(prodData)}`);

        const product = prodData.data.product;
        console.log(`✅ Producto creado: ${product.description}`);
        console.log(`   Costo: ${product.cost}, Margen: ${product.margin}, Precio: ${product.price}`);

        if (Math.abs(parseFloat(product.price) - expectedPrice) < 0.01) {
            console.log('✅ Cálculo de precio CORRECTO.');
        } else {
            console.error(`❌ Cálculo de precio INCORRECTO. Esperado: ${expectedPrice}, Recibido: ${product.price}`);
        }

        // 3. Crear Servicio
        console.log('\n🧪 Prueba 2: Crear Servicio');
        const servRes = await fetch(PRODUCTS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'service',
                description: 'Servicio Test',
                code: `SERV-${Date.now()}`,
                cost: 50,
                margin: 0.50 // Precio debería ser 100
            })
        });

        const servData = await servRes.json();
        const service = servData.data.product;
        console.log(`✅ Servicio creado: ${service.description}`);
        console.log(`   Precio calculado: ${service.price} (Esperado: 100.00)`);

        console.log('\n✨ PRUEBAS DE PRODUCTOS COMPLETADAS ✨');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

runTest();
