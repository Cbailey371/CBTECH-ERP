async function debug() {
    const API_URL = 'http://localhost:5001/api';
    console.log('Testing APIs at', API_URL);

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

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
        }

        const loginData = await loginRes.json();
        console.log('Login Response:', loginData);
        const token = loginData.data?.token || loginData.token;
        const companyId = 1; // Default to 1 for test if not returned

        console.log('Login success. Using Company ID:', companyId);

        const headers = {
            'Authorization': `Bearer ${token}`,
            'x-company-id': companyId.toString() // headers need string
        };

        // 2. Fetch Suppliers
        console.log('\n--- Fetching Suppliers ---');
        const suppliersRes = await fetch(`${API_URL}/suppliers`, { headers });
        console.log('Status:', suppliersRes.status);
        const suppliersData = await suppliersRes.json();
        console.log('Suppliers JSON Keys:', Object.keys(suppliersData));

        if (suppliersData.suppliers) {
            console.log('Found "suppliers" key. Count:', suppliersData.suppliers.length);
        } else if (suppliersData.data) {
            console.log('Found "data" key.');
        }

        // 3. Fetch Products
        console.log('\n--- Fetching Products ---');
        const productsRes = await fetch(`${API_URL}/products?type=product`, { headers });
        console.log('Status:', productsRes.status);
        const productsData = await productsRes.json();
        console.log('Products JSON Keys:', Object.keys(productsData));

        if (productsData.data) {
            console.log('Found "data" key. Keys inside data:', Object.keys(productsData.data));
            if (productsData.data.products) {
                console.log('Found "data.products". Count:', productsData.data.products.length);
            }
        }

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
}

debug();
