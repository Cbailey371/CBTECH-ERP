async function testDigifactSuccess() {
    console.log("==================================================");
    console.log("🚀 PRUEBA DE INTEGRACIÓN - ESQUEMA VALIDADO PROVEEDOR");
    console.log("==================================================\n");

    const rucSandbox = '155704849-2-2021';
    
    // 1. Obtención de Token
    // Intentaremos con las dos URLs conocidas por si una falla (404/500)
    const loginUrls = [
        'https://testnucpa.digifact.com/api/login/get_token',
        'https://nucpa.digifact.com/api/login/get_token'
    ];
    
    let token = '';
    let successLoginUrl = '';

    for (const url of loginUrls) {
        console.log(`Intentando login en: ${url}...`);
        try {
            const loginRes = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Username: `PA.${rucSandbox}.CBAILEY`, Password: 'Digifact*25' })
            });
            const loginText = await loginRes.text();
            if (loginRes.ok && !loginText.startsWith('<')) {
                const loginData = JSON.parse(loginText);
                token = loginData.Token;
                successLoginUrl = url;
                console.log('✅ Token obtenido exitosamente.');
                break;
            } else {
                console.log(`❌ Falló ${url}: ${loginRes.status}`);
            }
        } catch (e) {
            console.log(`❌ Error en ${url}: ${e.message}`);
        }
    }

    if (!token) {
        console.error("\n❌ No se pudo obtener el token en ningún endpoint. Verifica las credenciales o el estado de los servidores de Digifact.");
        return;
    }

    // 2. Payload exacto que le funcionó al proveedor (ajustado con fecha actual)
    const nucJson = {
        "Version": "1.00",
        "CountryCode": "PA",
        "Header": {
            "DocType": "01",
            "IssuedDateTime": new Date().toISOString().replace('Z', '-05:00'),
            "AdditionalIssueType": 2, // 2 = Ambiente de pruebas
            "Currency": null,
            "AdditionalIssueDocInfo": [
                { "Name": "TipoEmision", "Data": null, "Value": "01" },
                { "Name": "NumeroDF", "Data": null, "Value": "0000000001" },
                { "Name": "PtoFactDF", "Data": null, "Value": "987" }, // > 599 para pruebas
                { "Name": "CodigoSeguridad", "Data": null, "Value": "000813676" },
                { "Name": "NaturalezaOperacion", "Data": null, "Value": "01" },
                { "Name": "TipoOperacion", "Data": null, "Value": "1" },
                { "Name": "DestinoOperacion", "Data": null, "Value": "1" },
                { "Name": "FormatoGeneracion", "Data": null, "Value": "1" },
                { "Name": "ManeraEntrega", "Data": null, "Value": "1" },
                { "Name": "EnvioContenedor", "Data": null, "Value": "1" },
                { "Name": "ProcesoGeneracion", "Data": null, "Value": "1" },
                { "Name": "TipoTransaccion", "Data": null, "Value": "1" },
                { "Name": "TipoSucursal", "Data": null, "Value": "2" }
            ]
        },
        "Seller": {
            "TaxID": rucSandbox,
            "TaxIDType": "2",
            "TaxIDAdditionalInfo": [{ "Name": "DigitoVerificador", "Data": null, "Value": "32" }],
            "Name": "FE generada en ambiente de pruebas - sin valor comercial ni fiscal",
            "Contact": { "PhoneList": { "Phone": ["997-8242"] }, "EmailList": null },
            "BranchInfo": {
                "Code": "0001",
                "AddressInfo": {
                    "Address": "Blv Costa del Este, PH Financial Tower Piso 17",
                    "City": "Bocas del Toro (Cabecera)",
                    "District": "Bocas del Toro",
                    "State": "Bocas del Toro",
                    "Country": "PA"
                },
                "AdditionalBranchInfo": [
                    { "Name": "CoordEm", "Data": null, "Value": "+8.9892,-79.5201" },
                    { "Name": "CodUbi", "Data": null, "Value": "1-1-1" }
                ]
            }
        },
        "Buyer": {
            "TaxID": "15430-249-148718",
            "TaxIDType": "2",
            "TaxIDAdditionalInfo": [
                { "Name": "TipoReceptor", "Data": null, "Value": "01" },
                { "Name": "DigitoVerificador", "Data": null, "Value": "9" },
                { "Name": "CodUbi", "Data": null, "Value": "1-1-1" }
            ],
            "Name": "Ace International Hardware Corp.",
            "AdditionlInfo": [{ "Name": "PaisReceptorFE", "Data": null, "Value": "PA" }],
            "AddressInfo": {
                "Address": "Westland Mall, Vista Alegre, Arraijan",
                "City": "Bocas del Toro (Cabecera)",
                "District": "Bocas del Toro",
                "State": "Bocas del Toro",
                "Country": "PA"
            }
        },
        "Items": [
            {
                "Codes": [
                    { "Name": "CodigoProd", "Data": null, "Value": "1234567890" },
                    { "Name": "CodCPBSabr", "Data": null, "Value": "13" },
                    { "Name": "CodCPBScmp", "Data": null, "Value": "1310" }
                ],
                "Description": "ITEM",
                "Qty": 1.00,
                "UnitOfMeasure": "m",
                "Price": 1.000000,
                "Taxes": { "Tax": [{ "Code": "00", "Description": "ITBMS", "Amount": 0.00 }] },
                "Charges": { "Charge": [{ "Amount": 1.01 }] },
                "Totals": {
                    "TotalBTaxes": 1.0,
                    "TotalWTaxes": 1.0,
                    "SpecificTotal": 2.01,
                    "TotalItem": 2.01
                }
            }
        ],
        "Totals": {
            "QtyItems": 1,
            "GrandTotal": {
                "TotalBTaxes": 2.01,
                "TotalWTaxes": 2.01,
                "InvoiceTotal": 2.01
            }
        },
        "Payments": [{ "Type": "01", "Amount": 2.01 }],
        "AdditionalDocumentInfo": {
            "AdditionalInfo": [{ "AditionalInfo": [{ "Name": "TiempoPago", "Data": null, "Value": "1" }] }]
        }
    };

    // 3. Envío al Transfomador
    const transformUrl = successLoginUrl.includes('testnucpa') 
        ? 'https://testnucpa.digifact.com/api/v2/transform/nuc_json' 
        : 'https://nucpa.digifact.com/api/v2/transform/nuc_json';
        
    console.log(`\nEnviando a transformador: ${transformUrl}...`);
    const qs = new URLSearchParams({ TAXID: rucSandbox, FORMAT: 'XML|HTML|PDF', USERNAME: 'CBAILEY' }).toString();
    
    try {
        const certRes = await fetch(`${transformUrl}?${qs}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': token },
            body: JSON.stringify(nucJson)
        });
        
        const certText = await certRes.text();
        console.log(`\nHTTP Status: ${certRes.status}`);
        
        try {
            const result = JSON.parse(certText);
            console.log("\nRESPUESTA JSON:");
            console.log(JSON.stringify(result, null, 2));
        } catch (e) {
            console.log("\nRESPUESTA NO JSON:");
            console.log(certText.substring(0, 1000));
        }
    } catch (e) {
        console.error("\n❌ Error en envío:", e.message);
    }
}

testDigifactSuccess();
