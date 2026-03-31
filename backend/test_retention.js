const DigifactAdapter = require('./services/fepa/adapters/DigifactAdapter');

async function testRetention() {
    const config = {
        ruc: '8-762-367',
        dv: '65',
        razonSocial: 'CBTECH Consulting',
        environment: 'TEST'
    };
    const adapter = new DigifactAdapter(config);

    const testDoc = {
        docType: '01',
        documentNumber: '260054',
        customer: {
            name: 'Parlamento Lat',
            tipoReceptor: '03', // GOBIERNO
            objetoRetencion: '01', // Con retención
            taxId: '8-NT-2-8151',
            dv: '84'
        },
        items: [
            {
                description: 'Cargador Laptop',
                price: 18.97,
                quantity: 1,
                taxRate: 0.07 // 7%
            }
        ]
    };

    const nuc = adapter.mapToNucJson(testDoc);
    
    console.log('🧪 VERIFICANDO LÓGICA DE RETENCIÓN');
    console.log(`- Subtotal: 18.97`);
    console.log(`- ITBMS esperado (7%): 1.33`);
    console.log(`- Total Bruto: 20.30`);
    console.log(`- Retención esperada (100%): 1.33`);
    console.log(`- Total Neto esperado (Final): 18.97`);
    console.log('\n--- RESULTADOS NUC JSON ---');
    console.log(`- FormatoGeneracion: ${nuc.Header.AdditionalIssueDocInfo.find(i => i.Name === 'FormatoGeneracion').Value}`);
    console.log(`- InvoiceTotal: ${nuc.Totals.GrandTotal.InvoiceTotal}`);
    console.log(`- TotalRetenciones: ${nuc.Totals.GrandTotal.TotalRetenciones}`);
    console.log(`- Payment Amount: ${nuc.Payments[0].Amount}`);

    if (nuc.Totals.GrandTotal.InvoiceTotal === 18.97) {
        console.log('\n✅ ÉXITO: El total a pagar es el subtotal (Retención aplicada).');
    } else {
        console.log('\n❌ ERROR: El total sigue siendo incorrecto.');
    }
}

testRetention();
