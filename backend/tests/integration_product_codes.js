const API_URL = 'http://localhost:5001/api';
const AUTH_URL = `${API_URL}/auth/login`;
const PRODUCTS_URL = `${API_URL}/products`;

async function runTest() {
    console.log('🚀 Iniciando Prueba: Generación Automática de Códigos');

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
        console.log('✅ Login exitoso');

        // 2. Crear Producto (sin código)
        console.log('\n🧪 Prueba 1: Crear Producto sin código');
        const prodRes = await fetch(PRODUCTS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'product',
                description: 'Laptop HP ProBook',
                cost: 500,
                margin: 0.30
            })
        });

        const prodData = await prodRes.json();
        if (!prodRes.ok) throw new Error(`Error creando producto: ${JSON.stringify(prodData)}`);

        const product = prodData.data.product;
        console.log(`✅ Producto creado:`);
        console.log(`   Código: ${product.code}`);
        console.log(`   Descripción: ${product.description}`);
        console.log(`   Costo: $${product.cost}, Margen: ${product.margin}, Precio: $${product.price}`);

        if (product.code.startsWith('PROD-')) {
            console.log('✅ Código de producto CORRECTO (formato PROD-XXX)');
        } else {
            console.error(`❌ Código de producto INCORRECTO: ${product.code}`);
        }

        // 3. Crear Servicio (sin código)
        console.log('\n🧪 Prueba 2: Crear Servicio sin código');
        const servRes = await fetch(PRODUCTS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'service',
                description: 'Instalación de Software',
                cost: 100,
                margin: 0.40
            })
        });

        const servData = await servRes.json();
        if (!servRes.ok) throw new Error(`Error creando servicio: ${JSON.stringify(servData)}`);

        const service = servData.data.product;
        console.log(`✅ Servicio creado:`);
        console.log(`   Código: ${service.code}`);
        console.log(`   Descripción: ${service.description}`);
        console.log(`   Costo: $${service.cost}, Margen: ${service.margin}, Precio: $${service.price}`);

        if (service.code.startsWith('SERV-')) {
            console.log('✅ Código de servicio CORRECTO (formato SERV-XXX)');
        } else {
            console.error(`❌ Código de servicio INCORRECTO: ${service.code}`);
        }

        // 4. Crear otro producto para verificar secuencia
        console.log('\n🧪 Prueba 3: Crear segundo producto (verificar secuencia)');
        const prod2Res = await fetch(PRODUCTS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                type: 'product',
                description: 'Monitor Dell 27"',
                cost: 200,
                margin: 0.25
            })
        });

        const prod2Data = await prod2Res.json();
        const product2 = prod2Data.data.product;
        console.log(`✅ Segundo producto creado:`);
        console.log(`   Código: ${product2.code}`);
        console.log(`   Descripción: ${product2.description}`);

        // Verificar que el código incrementó
        const prodNum1 = parseInt(product.code.split('-')[1]);
        const prodNum2 = parseInt(product2.code.split('-')[1]);
        if (prodNum2 === prodNum1 + 1) {
            console.log('✅ Secuencia de códigos CORRECTA');
        } else {
            console.error(`❌ Secuencia INCORRECTA: ${product.code} -> ${product2.code}`);
        }

        console.log('\n✨ PRUEBAS COMPLETADAS EXITOSAMENTE ✨');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

runTest();
