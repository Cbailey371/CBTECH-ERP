// const fetch = require('node-fetch'); // Using native fetch in Node 20+

const BASE_URL = 'http://127.0.0.1:5001/api';
const ADMIN_EMAIL = 'admin@erp.com';
const ADMIN_PASSWORD = 'admin123';

const runVerification = async () => {
    try {
        console.log('Starting API Verification for Code Generation...');

        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });
        const text = await loginRes.text();
        let loginData;
        try {
            loginData = JSON.parse(text);
        } catch (e) {
            throw new Error(`Login JSON parse failed: ${text.substring(0, 200)}...`);
        }
        if (!loginData.token) throw new Error('Login failed: ' + JSON.stringify(loginData));
        const token = loginData.token;
        console.log('   Login successful.');
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 2. Create Company
        console.log('2. Creating Company...');
        const uniqueSuffix = Date.now();
        const companyRes = await fetch(`${BASE_URL}/companies`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Test Company ${uniqueSuffix}`,
                legal_name: `Test Legal ${uniqueSuffix}`,
                tax_id: `TAX-${uniqueSuffix}`,
                email: `company${uniqueSuffix}@test.com`,
                address_line1: '123 Test St',
                city: 'Test City'
            })
        });
        const companyData = await companyRes.json();
        if (!companyData.success) throw new Error('Company creation failed: ' + JSON.stringify(companyData));
        console.log(`   Company created. Code: ${companyData.company.code}`);
        if (!companyData.company.code) throw new Error('Company code missing');

        // Set context to this new company for subsequent calls?
        // Most routes use 'x-company-id' or logic to pick company.
        // But our routes usually assume the user belongs to the company or we select it.
        // For simplicity, let's use the company we just created?
        // Actually, the admin might need to be associated or we use the default company 1 which the admin is likely part of.
        // Let's use the default company ID 1 for simplicity to avoid association complexity in this script.
        const companyId = 1;

        // 3. Create User
        console.log('3. Creating User...');
        const userRes = await fetch(`${BASE_URL}/users`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                username: `user${uniqueSuffix}`,
                email: `user${uniqueSuffix}@test.com`,
                password: 'password123',
                firstName: 'Test',
                role: 'user'
            })
        });
        const userData = await userRes.json();
        // Note: Users route might return different structure
        if (!userData.id && !userData.user?.id) throw new Error('User creation failed: ' + JSON.stringify(userData));
        const userCode = userData.code || userData.user?.code;
        console.log(`   User created. Code: ${userCode}`);
        if (!userCode) throw new Error('User code missing');


        // 4. Create Customer
        console.log('4. Creating Customer...');
        // We need to set the company context header?
        // The middleware checks 'x-company-id'.
        headers['x-company-id'] = companyId;

        const customerRes = await fetch(`${BASE_URL}/customers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Customer ${uniqueSuffix}`,
                email: `customer${uniqueSuffix}@test.com`,
                phone: '555-0100',
                taxId: `CUSTTAX-${uniqueSuffix}`
            })
        });
        const customerData = await customerRes.json();
        console.log(`   Customer created. Code: ${customerData.customer?.code}`);
        if (!customerData.customer?.code) throw new Error('Customer code missing');

        // 5. Create Supplier
        console.log('5. Creating Supplier...');
        const supplierRes = await fetch(`${BASE_URL}/suppliers`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: `Supplier ${uniqueSuffix}`,
                email: `supplier${uniqueSuffix}@test.com`,
                taxId: `SUPPTAX-${uniqueSuffix}`,
                phone: '555-0200'
            })
        });
        const supplierData = await supplierRes.json();
        console.log(`   Supplier created. Code: ${supplierData.supplier?.code}`);
        if (!supplierData.supplier?.code) throw new Error('Supplier code missing');


        // 6. Create Project
        console.log('6. Creating Project...');
        const projectRes = await fetch(`${BASE_URL}/projects`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId: customerData.customer.id,
                name: `Project ${uniqueSuffix}`,
                description: 'Test Project',
                startDate: '2025-01-01',
                endDate: '2025-12-31',
                budget: 1000
            })
        });
        const projectData = await projectRes.json();
        const projectCode = projectData.project?.code;
        console.log(`   Project created. Code: ${projectCode}`);
        if (!projectCode) throw new Error('Project code missing');


        // 7. Create Task
        console.log('7. Creating Task...');
        const taskRes = await fetch(`${BASE_URL}/tasks`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                projectId: projectData.project.id,
                title: `Task ${uniqueSuffix}`,
                description: 'Test Task',
                status: 'todo',
                priority: 'medium'
            })
        });
        const taskData = await taskRes.json();
        const taskCode = taskData.task?.code;
        console.log(`   Task created. Code: ${taskCode}`);
        if (!taskCode) throw new Error('Task code missing');

        // 8. Create Contract
        console.log('8. Creating Contract...');
        const contractRes = await fetch(`${BASE_URL}/contracts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                customerId: customerData.customer.id,
                title: `Contract ${uniqueSuffix}`,
                description: 'Test Contract',
                start_date: '2025-01-01',
                end_date: '2025-12-31',
                value: 5000
            })
        });
        const contractData = await contractRes.json();
        const contractCode = contractData.contract?.code;
        console.log(`   Contract created. Code: ${contractCode}`);
        if (!contractCode) throw new Error('Contract code missing');

        console.log('✅ ALL VERIFICATIONS PASSED');

    } catch (error) {
        console.error('❌ Verification Failed:', error.message);
    }
};

runVerification();
