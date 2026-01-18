const { generateDeliveryNotePdf } = require('./backend/services/pdf/deliveryNotePdfGenerator');
const fs = require('fs');

const dummyNote = {
    number: 'NE-TEST-001',
    date: '2026-01-17',
    customer: { name: 'Test Customer', taxId: '123-456' },
    items: [
        { description: 'Item 1', quantity: 1 },
        { description: 'Item 2', quantity: 5 }
    ],
    notes: 'Test notes'
};

const dummyCompany = {
    name: 'Test Company',
    taxId: '8-888-888',
    dv: '88',
    addressLine1: 'Test Address',
    phone: '1234-5678',
    email: 'test@company.com',
    documentLogo: 'uploads/logos/non_existent.png',
    getFullAddress: () => 'Full Test Address'
};

(async () => {
    try {
        console.log('Generating PDF...');
        const buffer = await generateDeliveryNotePdf(dummyNote, dummyCompany);
        fs.writeFileSync('test.pdf', buffer);
        console.log('PDF generated successfully: test.pdf');
        process.exit(0);
    } catch (error) {
        console.error('Error generating PDF:', error);
        process.exit(1);
    }
})();
