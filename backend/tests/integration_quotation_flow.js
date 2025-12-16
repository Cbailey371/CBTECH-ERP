// const fetch = require('node-fetch'); // Usando fetch nativo de Node.js

const API_URL = 'http://localhost:3000/api';
let token = '';
let companyId = '';
let customerId = '';
let quotationId = '';

const login = async () => {
    console.log('1. Autenticando como Admin...');
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.error('Error parseando JSON:', text);
        throw new Error('Respuesta no es JSON');
    }

    if (data.success) {
        token = data.data.token;
        console.log('✅ Login exitoso.');

        // Obtener empresas
        const companiesRes = await fetch(`${API_URL}/companies/my-companies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const companiesData = await companiesRes.json();
        companyId = companiesData.companies[0].id;
        console.log(`✅ Empresa seleccionada ID: ${companyId}`);
    } else {
        throw new Error('Login fallido: ' + JSON.stringify(data));
    }
};

const getCustomer = async () => {
    console.log('2. Obteniendo un cliente...');
    const response = await fetch(`${API_URL}/customers?limit=1`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-company-id': companyId
        }
    });
    const data = await response.json();
    if (data.success && data.customers.length > 0) {
        customerId = data.customers[0].id;
        console.log(`✅ Cliente encontrado ID: ${customerId}`);
    } else {
        // Crear uno si no hay
        console.log('   No hay clientes, creando uno...');
        const createRes = await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-company-id': companyId
            },
            body: JSON.stringify({
                name: 'Cliente Cotizacion Test',
                tradeName: 'Cotizacion Test',
                taxId: `RUC-${Date.now()}`,
                dv: '00',
                email: `cotizacion${Date.now()}@test.com`,
                phone: '555-5555',
                address: 'Ciudad',
                isActive: true
            })
        });
        const createData = await createRes.json();
        customerId = createData.customer.id;
        console.log(`✅ Cliente creado ID: ${customerId}`);
    }
};

const createQuotation = async () => {
    console.log('3. Creando Cotización...');
    const response = await fetch(`${API_URL}/quotations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-company-id': companyId
        },
        body: JSON.stringify({
            customerId,
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0], // +15 dias
            notes: 'Cotización de prueba integración',
            items: [
                { description: 'Producto A', quantity: 10, unitPrice: 50 }, // 500
                { description: 'Servicio B', quantity: 1, unitPrice: 1000 }  // 1000
            ]
        })
    });
    const data = await response.json();
    if (data.success) {
        quotationId = data.quotation.id;
        console.log(`✅ Cotización creada ID: ${quotationId}`);
        console.log(`   Número: ${data.quotation.number}`);
        console.log(`   Total: ${data.quotation.total}`);

        // Validar total: (500 + 1000) * 1.07 = 1605
        if (Math.abs(parseFloat(data.quotation.total) - 1605) < 0.01) {
            console.log('✅ Cálculo de total correcto (1605.00)');
        } else {
            console.error(`❌ Cálculo incorrecto. Esperado: 1605, Recibido: ${data.quotation.total}`);
        }
    } else {
        console.error('❌ Error creando cotización:', data);
        throw new Error('Falló creación');
    }
};

const listQuotations = async () => {
    console.log('4. Listando Cotizaciones...');
    const response = await fetch(`${API_URL}/quotations`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'x-company-id': companyId
        }
    });
    const data = await response.json();
    if (data.success) {
        const found = data.quotations.find(q => q.id === quotationId);
        if (found) {
            console.log('✅ Cotización encontrada en la lista.');
        } else {
            console.error('❌ Cotización NO encontrada en la lista.');
        }
    }
};

const run = async () => {
    try {
        await login();
        await getCustomer();
        await createQuotation();
        await listQuotations();
        console.log('\n✨ PRUEBA DE COTIZACIONES COMPLETADA EXITOSAMENTE ✨');
    } catch (error) {
        console.error('\n❌ PRUEBA FALLIDA:', error);
        process.exit(1);
    }
};

run();
