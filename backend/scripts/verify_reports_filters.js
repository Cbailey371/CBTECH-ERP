// Native fetch is used

const API_URL = 'http://localhost:5001/api';

async function verifyReports() {
    console.log('--- Verifying Reports Module Filters ---');

    // 1. Login
    console.log('1. Logging in as Admin...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'admin@erp.com',
            password: 'admin123'
        })
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
        console.error('Login failed:', loginData);
        return;
    }
    console.log('Login successful.');
    const token = loginData.data.token;

    // Get Company ID (assume first company)
    // We need to fetch user profile or companies to get a valid company ID
    // For simplicity, let's try to get it from the login response if available, or fetch companies

    // Let's just blindly try to fetch companies to get a valid ID
    const companiesResponse = await fetch(`${API_URL}/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const companiesData = await companiesResponse.json();
    const companyId = companiesData.data?.companies?.[0]?.id; // Adjusted path based on API response structure

    if (!companyId) {
        console.error('No companies found for user.');
        return;
    }
    console.log(`Using Company ID: ${companyId}`);

    // headers with company context
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-company-id': companyId // Although middleware might prefer query param, let's try header or verify if we need to add query param
    };

    // Note: Previous tasks mentioned middleware prefers query param 'companyId', let's append it to URLs just in case for GETs, 
    // but for POST bodies we can include it or use header. The reports endpoint checks bodyCompanyId or header.

    // 2. Create a specific Test Quotation to filter for
    const uniqueNum = `TEST-REP-${Date.now()}`;
    console.log(`2. Creating Test Quotation with number: ${uniqueNum}...`);

    // Need a customer first? Let's generic fetch customers and pick one
    const customersRes = await fetch(`${API_URL}/customers?companyId=${companyId}`, { headers });
    const customersData = await customersRes.json();
    const customerId = customersData.customers?.[0]?.id;

    if (!customerId) {
        console.error('No customers found. Cannot create quotation.');
        return;
    }

    const createQuotRes = await fetch(`${API_URL}/quotations?companyId=${companyId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            customerId,
            date: new Date().toISOString().split('T')[0],
            validUntil: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            items: [{ description: 'Test Item', quantity: 1, unitPrice: 100 }],
            companyId // Explicitly sending it
        })
    });

    const createQuotData = await createQuotRes.json();
    if (!createQuotData.success) {
        console.error('Failed to create quotation:', createQuotData);
        return;
    }
    const quotationId = createQuotData.quotation.id;
    const quotationNumber = createQuotData.quotation.number; // The system generates the number, ignore our uniqueNum for the actual DB field if it overrides it.
    // Wait, the backend generates the number: `COT-YYYY-XXXX`. 
    // We can't easily force a custom number based on the code I read (it auto-generates).
    // So we will use the returned number filter.
    console.log(`Quotation created. ID: ${quotationId}, Number: ${quotationNumber}`);


    // 3. Test Filter: Match Exact Number
    console.log('3. Testing Filter: Exact Match on Number...');
    const reportMatchRes = await fetch(`${API_URL}/reports/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            entity: 'sales',
            companyId,
            filters: [
                { field: 'number', operator: 'eq', value: quotationNumber }
            ],
            columns: [{ key: 'number', label: 'Number' }, { key: 'total', label: 'Total' }]
        })
    });

    const reportMatchData = await reportMatchRes.json();
    const foundMatch = reportMatchData.data?.find(q => q.number === quotationNumber);

    if (foundMatch) {
        console.log('✅ Filter Verified: Found specific quotation by number.');
    } else {
        console.error('❌ Filter Failed: Did not find specific quotation by number.', reportMatchData);
    }

    // 4. Test Filter: Status (Draft)
    console.log('4. Testing Filter: Status = draft...');
    const reportStatusRes = await fetch(`${API_URL}/reports/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            entity: 'sales',
            companyId,
            filters: [
                { field: 'status', operator: 'eq', value: 'draft' },
                { field: 'number', operator: 'eq', value: quotationNumber } // Narrow down to our test qt
            ],
            columns: [{ key: 'number' }, { key: 'status' }]
        })
    });

    const reportStatusData = await reportStatusRes.json();
    const foundStatus = reportStatusData.data?.find(q => q.number === quotationNumber && q.status === 'draft');

    if (foundStatus) {
        console.log('✅ Filter Verified: Found quotation by Status=draft.');
    } else {
        console.error('❌ Filter Failed: Did not find quotation by Status=draft.');
    }

    // 5. Test Filter: Negative Match (Should NOT find it)
    console.log('5. Testing Filter: Status = accepted (Should NOT match)...');
    const reportNoMatchRes = await fetch(`${API_URL}/reports/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            entity: 'sales',
            companyId,
            filters: [
                { field: 'status', operator: 'eq', value: 'accepted' }, // Our qt is draft
                { field: 'number', operator: 'eq', value: quotationNumber }
            ],
            columns: [{ key: 'number' }]
        })
    });

    const reportNoMatchData = await reportNoMatchRes.json();
    const foundNoMatch = reportNoMatchData.data?.find(q => q.number === quotationNumber);

    if (!foundNoMatch) {
        console.log('✅ Negative Filter Verified: Quotation correctly excluded.');
    } else {
        console.error('❌ Negative Filter Failed: Quotation appeared but should have been excluded.');
    }


    // 6. Test Filter: Relation (Customer Name)
    // First fetch the customer name used
    // We used customerId from step 2
    // Let's verify we can filter by 'customer.name'
    console.log('6. Testing Filter: Relation (customer.name)...');

    // We need the customer name. Fetch it or assume partially.
    // Let's fetch the customer detail properly
    const custRes = await fetch(`${API_URL}/customers/${customerId}`, { headers });
    const custData = await custRes.json();
    const customerName = custData.customer?.name || 'Cliente';
    console.log(`   Filtering by customer name: "${customerName}"`);

    const reportRelRes = await fetch(`${API_URL}/reports/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            entity: 'sales',
            companyId,
            filters: [
                { field: 'customer.name', operator: 'like', value: customerName }, // Partial match
                { field: 'number', operator: 'eq', value: quotationNumber }
            ],
            columns: [{ key: 'number' }, { key: 'customer.name' }]
        })
    });

    const reportRelData = await reportRelRes.json();
    const foundRel = reportRelData.data?.find(q => q.number === quotationNumber);

    if (foundRel) {
        console.log('✅ Relation Filter Verified: Found quotation by Customer Name.');
    } else {
        console.error('❌ Relation Filter Failed: Did not find quotation by Customer Name.', reportRelData);
    }

    console.log('--- Verification Complete ---');
}

verifyReports().catch(console.error);
