const axios = require('axios');

const API_URL = 'http://localhost:5001/api';
const USER = { email: 'admin@erp.com', password: 'admin123' };

async function verifyFix() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, USER);
        const token = loginRes.data.token;
        console.log('   Login successful');

        const api = axios.create({
            baseURL: API_URL,
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('2. Fetching Companies...');
        const companiesRes = await api.get('/companies');
        const companies = companiesRes.data.data.companies;

        if (companies.length < 2) {
            console.error('   Not enough companies to test switching. Found:', companies.length);
            return;
        }

        const company1 = companies[0];
        const company2 = companies[1];
        console.log(`   Company 1: ID ${company1.id} (${company1.name})`);
        console.log(`   Company 2: ID ${company2.id} (${company2.name})`);

        console.log('3. Testing Dashboard Metrics (Header=1, Query=2)...');
        // Request metrics for Company 2, but send Header for Company 1
        const metricsRes = await api.get('/dashboard/metrics', {
            headers: { 'X-Company-Id': company1.id },
            params: { companyId: company2.id } // Note: Route reads 'companyId' from req.companyContext, but usually ignores query param 'companyId' if middleware rewrites it.
            // However, dashboardService sends 'period' and sometimes 'companyId' in query.
            // BUT wait, dashboardRoutes.js line 15: const companyId = parseInt(req.companyContext.companyId, 10);
            // The middleware sets req.companyContext.
            // The middleware NOW reads req.query.company_id (underscore) first.
            // dashboardService uses: params: { companyId } -> this becomes 'companyId' in query string, NOT 'company_id'.
            // AXIOS params serializer: { companyId: 1 } -> ?companyId=1

            // WAIT! The middleware reads 'company_id' (underscore).
            // dashboardService sends 'companyId' (camelCase).
            // Let's check dashboardService.js again.
        });

        // Wait, I need to check if dashboardService sends company_id or companyId.
        // dashboardService.js: params: { companyId, period ... }
        // So it sends ?companyId=...
        // companyContext.js: req.query.company_id || req.headers['x-company-id']
        // THIS IS A MISMATCH!

        // If I changed the middleware to read 'company_id', but the frontend sends 'companyId', IT WON'T WORK!
        // I need to check this before running the script.

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.error('Response:', error.response.data);
    }
}

// verifyFix(); 
// Not running yet, realized potential bug.
