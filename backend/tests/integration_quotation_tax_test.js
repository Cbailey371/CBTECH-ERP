const API_URL = 'http://localhost:3000/api';
const AUTH_URL = `${API_URL}/auth/login`;
const CUSTOMERS_URL = `${API_URL}/customers`;
const QUOTATIONS_URL = `${API_URL}/quotations`;

async function runTest() {
    console.log('🚀 Iniciando Prueba de Integración: Impuestos en Cotizaciones');

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

        // 2. Crear Cliente Temporal
        const randomSuffix = Math.floor(Math.random() * 10000);
        const customerPayload = {
            name: `Cliente Tax Test ${randomSuffix}`,
            tradeName: `Trade Test ${randomSuffix}`,
            taxId: `TAX-${randomSuffix}`,
            dv: '00',
            phone: '12345678',
            address: 'Test Address',
            email: `tax${randomSuffix}@test.com`
        };

        const customerRes = await fetch(CUSTOMERS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(customerPayload)
        });

        const customerData = await customerRes.json();
        if (!customerRes.ok) {
            throw new Error(`Error creando cliente: ${JSON.stringify(customerData)}`);
        }
        const { customer } = customerData;
        console.log(`✅ Cliente creado: ${customer.id}`);

        // 3. Prueba 1: Impuesto Default (7%)
        console.log('\n🧪 Prueba 1: Impuesto Default (7%)');
        const q1Res = await fetch(QUOTATIONS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId: customer.id,
                date: '2025-12-12',
                items: [{ description: 'Item 1', quantity: 1, unitPrice: 100 }],
                taxRate: 0.07
            })
        });
        const q1 = await q1Res.json();
        if (q1.quotation.tax === '7.00' || q1.quotation.tax === 7) {
            console.log('✅ Impuesto 7% calculado correctamente: $7.00');
        } else {
            console.error(`❌ Error en impuesto 7%: ${q1.quotation.tax}`);
        }

        // 4. Prueba 2: Impuesto Personalizado (10%)
        console.log('\n🧪 Prueba 2: Impuesto Personalizado (10%)');
        const q2Res = await fetch(QUOTATIONS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId: customer.id,
                date: '2025-12-12',
                items: [{ description: 'Item 2', quantity: 1, unitPrice: 100 }],
                taxRate: 0.10
            })
        });
        const q2 = await q2Res.json();
        if (q2.quotation.tax === '10.00' || q2.quotation.tax === 10) {
            console.log('✅ Impuesto 10% calculado correctamente: $10.00');
        } else {
            console.error(`❌ Error en impuesto 10%: ${q2.quotation.tax}`);
        }

        // 5. Prueba 3: Sin Impuesto (0%)
        console.log('\n🧪 Prueba 3: Sin Impuesto (0%)');
        const q3Res = await fetch(QUOTATIONS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId: customer.id,
                date: '2025-12-12',
                items: [{ description: 'Item 3', quantity: 1, unitPrice: 100 }],
                taxRate: 0
            })
        });
        const q3 = await q3Res.json();
        if (q3.quotation.tax === '0.00' || q3.quotation.tax === 0) {
            console.log('✅ Impuesto 0% calculado correctamente: $0.00');
        } else {
            console.error(`❌ Error en impuesto 0%: ${q3.quotation.tax}`);
        }

        // Limpieza (Opcional)
        await fetch(`${CUSTOMERS_URL}/${customer.id}`, { method: 'DELETE', headers });
        console.log('\n✨ PRUEBAS DE IMPUESTOS COMPLETADAS ✨');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

runTest();
