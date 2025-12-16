async function debug() {
    const API_URL = 'http://localhost:5001/api';
    console.log('Testing PO Creation at', API_URL);

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin@erp.com',
                password: 'admin123'
            })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);

        const loginData = await loginRes.json();
        const token = loginData.data?.token || loginData.token;
        const companyId = 1; // Default
        console.log('Token obtained.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'x-company-id': companyId.toString(),
            'Content-Type': 'application/json'
        };

        // 2. Fetch Supplier and Product to use valid IDs
        const suppliersRes = await fetch(`${API_URL}/suppliers?limit=1`, { headers });
        const suppliersData = await suppliersRes.json();
        const supplierId = suppliersData.suppliers[0].id;
        console.log('Using Supplier ID:', supplierId);

        const productsRes = await fetch(`${API_URL}/products?limit=1&type=product`, { headers });
        const productsData = await productsRes.json();
        const productId = productsData.data.products[0].id;
        console.log('Using Product ID:', productId);

        // 3. Create PO Payload
        const payload = {
            supplierId: supplierId,
            issueDate: new Date().toISOString().split('T')[0],
            deliveryDate: new Date().toISOString().split('T')[0],
            paymentTerms: 'Contado',
            notes: 'Test PO from debug script',
            items: [
                {
                    productId: productId,
                    description: 'Test Item',
                    quantity: 10,
                    unitPrice: 100,
                    taxRate: 0.07
                }
            ]
        };

        console.log('Sending Payload:', JSON.stringify(payload, null, 2));

        const createRes = await fetch(`${API_URL}/purchase-orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        console.log('Create Response Status:', createRes.status);
        const createData = await createRes.json();
        if (!createRes.ok) {
            console.error('Error Details:', createData);
        } else {
            console.log('Success! Created PO:', createData.data.id);
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    }
}

debug();
