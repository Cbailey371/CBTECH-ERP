const API_URL = 'http://localhost:3000/api';
const AUTH_URL = `${API_URL}/auth/login`;
const CUSTOMERS_URL = `${API_URL}/customers`;

async function runTest() {
    console.log('🚀 Iniciando Prueba de Integración: Gestión de Clientes (Fetch)');

    try {
        // 1. Login
        console.log('\n1. Autenticando como Admin...');
        const loginRes = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.statusText}`);
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-company-id': '1'
        };
        console.log('✅ Login exitoso.');

        // 2. Crear Cliente
        console.log('\n2. Creando Cliente de Prueba...');
        const newCustomer = {
            name: 'Cliente Integration Test',
            tradeName: 'Integration Test',
            taxId: 'TEST-12345',
            dv: '00',
            email: 'integration@test.com',
            phone: '555-5555',
            address: 'Calle de Prueba 123'
        };

        const createRes = await fetch(CUSTOMERS_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(newCustomer)
        });

        if (!createRes.ok) {
            const err = await createRes.json();
            throw new Error(`Create failed: ${JSON.stringify(err)}`);
        }

        const createData = await createRes.json();
        const createdId = createData.customer.id;
        console.log(`✅ Cliente creado con ID: ${createdId}`);

        // 3. Listar Clientes y Verificar
        console.log('\n3. Verificando existencia en lista...');
        const listRes = await fetch(CUSTOMERS_URL, { headers });
        const listData = await listRes.json();
        const found = listData.customers.find(c => c.id === createdId);

        if (found) {
            console.log('✅ Cliente encontrado en la lista.');
            console.log(`   Nombre: ${found.name}, RUC: ${found.taxId}`);
        } else {
            throw new Error('❌ El cliente creado no aparece en la lista.');
        }

        // 4. Actualizar Cliente
        console.log('\n4. Actualizando Cliente...');
        const updateData = {
            name: 'Cliente Integration Test ACTUALIZADO',
            notes: 'Nota agregada por test'
        };

        const updateRes = await fetch(`${CUSTOMERS_URL}/${createdId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateData)
        });

        if (!updateRes.ok) throw new Error(`Update failed: ${updateRes.statusText}`);

        // Verificar actualización
        const getRes = await fetch(`${CUSTOMERS_URL}/${createdId}`, { headers });
        const getData = await getRes.json();

        if (getData.customer.name === updateData.name) {
            console.log('✅ Cliente actualizado correctamente.');
        } else {
            throw new Error('❌ La actualización no se reflejó.');
        }

        // 5. Eliminar Cliente
        console.log('\n5. Eliminando Cliente...');
        const deleteRes = await fetch(`${CUSTOMERS_URL}/${createdId}`, {
            method: 'DELETE',
            headers
        });

        if (!deleteRes.ok) throw new Error(`Delete failed: ${deleteRes.statusText}`);
        console.log('✅ Cliente eliminado.');

        // 6. Verificar Eliminación
        console.log('\n6. Verificando eliminación...');
        const checkRes = await fetch(`${CUSTOMERS_URL}/${createdId}`, { headers });

        if (checkRes.status === 404) {
            console.log('✅ Cliente ya no existe (404 confirmado).');
        } else {
            throw new Error('❌ El cliente sigue existiendo (debería dar 404).');
        }

        console.log('\n✨ PRUEBA COMPLETADA EXITOSAMENTE ✨');

    } catch (error) {
        console.error('\n❌ ERROR EN LA PRUEBA:', error.message);
        process.exit(1);
    }
}

runTest();
