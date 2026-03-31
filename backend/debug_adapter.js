const DigifactAdapter = require('./services/fepa/adapters/DigifactAdapter');
const { calculateTaxes } = require('./utils/taxCalculations');

const mockData = {
    documentNumber: "F-123",
    docType: "01",
    items: [
        { description: "Item 1", quantity: 1, unitPrice: 100, taxRate: 0.07, total: 107 }
    ],
    customer: {
        name: "Test Customer",
        taxId: "123-456-789",
        tipoReceptor: "01",
        codUbi: "1-1-1",
        address: "Panama City"
    }
};

const adapter = new DigifactAdapter({
    environment: 'TEST',
    ruc: '155704849-2-2021',
    dv: '32',
    authData: { user: 'CBAILEY', password: 'password' }
});

try {
    console.log("Prueba de mapeo...");
    const result = adapter.mapToNucJson(mockData);
    console.log("Mapeo exitoso!");
    console.log(JSON.stringify(result, null, 2).substring(0, 500) + "...");
} catch (error) {
    console.error("ERROR EN EL ADAPTADOR:", error);
}
