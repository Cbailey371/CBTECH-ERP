
async function debug() {
    try {
        console.log('Authenticating...');
        // 1. Login
        const loginRes = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin@erp.com',
                password: 'admin123'
            })
        });

        if (!loginRes.ok) throw new Error('Login failed: ' + loginRes.status);
        const loginData = await loginRes.json();
        const token = loginData.data.token;
        const companyId = 1; // Default

        console.log('Login successful.');

        // 2. Get POs
        const res = await fetch('http://localhost:5001/api/purchase-orders', {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-company-id': companyId
            }
        });

        if (!res.ok) throw new Error('Get POs failed: ' + res.status);
        const data = await res.json();

        console.log('PO Response Status:', res.status);
        if (data.data) {
            console.log('PO Response Data Keys:', Object.keys(data.data));
            if (data.data.purchaseOrders) {
                console.log('Found purchaseOrders array. Length:', data.data.purchaseOrders.length);
                if (data.data.purchaseOrders.length > 0) {
                    console.log('First PO:', JSON.stringify(data.data.purchaseOrders[0], null, 2));

                    // Check ID specifically
                    const firstId = data.data.purchaseOrders[0].id;
                    console.log('First PO ID type:', typeof firstId);
                    console.log('First PO ID value:', firstId);
                }
            } else {
                console.log('purchaseOrders array missing in data.data');
            }
        } else {
            console.log('data.data missing');
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debug();
