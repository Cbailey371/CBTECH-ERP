const PACAdapter = require('../PACAdapter');
const { calculateTaxes } = require('../../../utils/taxCalculations');

class DigifactAdapter extends PACAdapter {
    constructor(config) {
        super(config);

        // Environment handling
        this.environment = config.environment || 'TEST';
        this.baseUrl = this.environment === 'PROD'
            ? 'https://nucpa.digifact.com'
            : 'https://testnucpa.digifact.com';

        // Ensure we only have the base username (e.g. CBAILEY) for query params, in case the user saved the prefix PA.RUC.USER
        let rawUser = (config.authData?.user || 'CBAILEY').trim();
        this.shortUsername = rawUser.includes('PA.') ? rawUser.split('.').pop() : rawUser;
        this.pacUsername = this.shortUsername;
        this.pacPassword = (config.authData?.password || 'Digifact*25').trim();

        // Emisor data
        this.rucEmisor = config.ruc || '155704849-2-2021';
        this.dvEmisor = config.dv || '32';
        this.sucursal = config.sucursal || '0000';

        // The Digifact Username format is usually PA.<RUC>.<USERNAME>
        if (rawUser.includes('PA.')) {
            this.loginUsername = rawUser;
        } else {
            const authRuc = this.environment === 'TEST' ? '155704849-2-2021' : this.rucEmisor;
            this.loginUsername = `PA.${authRuc}.${this.shortUsername}`;
        }

        // Token Cache
        this.token = null;
        this.tokenExpiry = null;
    }

    /**
     * Authenticates with Digifact API and retrieves a token.
     * Caches the token to avoid unnecessary requests.
     */
    async getToken(forceRefresh = false) {
        // If we have a valid token and not forcing a refresh, return it
        if (!forceRefresh && this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.token;
        }

        const loginUrl = `${this.baseUrl}/api/login/get_token`;

        try {
            console.log(`🔑 Autenticando con Digifact (${this.environment})...`);

            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Username: this.loginUsername,
                    Password: this.pacPassword
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Digifact Auth HTTP Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();

            this.token = data.Token;

            // Digifact tokens are valid for 30 days. We set expiry to 29 days to be safe.
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 29);
            this.tokenExpiry = expiry;

            console.log('✅ Token de Digifact obtenido exitosamente.');
            return this.token;

        } catch (error) {
            console.error("❌ Digifact Auth Error:", error);
            throw new Error(`Error autenticando con Digifact: ${error.message}`);
        }
    }

    /**
     * Maps Tax Rate percentage to Digifact ITBMS Codes (E0911)
     */
    mapItbmsCode(taxRate) {
        const rate = parseFloat(taxRate) || 0;
        if (rate === 0.07 || rate === 7) return '01';  // 7% - ITBMS estándar
        if (rate === 0.10 || rate === 10) return '02';  // 10%
        if (rate === 0.15 || rate === 15) return '03';  // 15%
        return '00'; // Exento o no aplica
    }

    /**
     * Maps internal ERP document data to Digifact NUC-JSON v2.0.8 format.
     *
     * KEY MAPPINGS (NUC ref -> JSON field):
     *   A04 = Header.AdditionalIssueType  ("2"=pruebas, "1"=producción)
     *   AI01 = AdditionalIssueDocInfo[{Name:"TipoEmision", Value}]
     *   BI02 = AdditionalBranchInfo[{Name:"CoordEm", Value}]
     *   BI03 = AdditionalBranchInfo[{Name:"CodUbi", Value}]
     *   F02  = Totals.QtyItems
     */
    mapToNucJson(docData) {
        const { totalTaxable, totalTax, totalAmount } = calculateTaxes(docData.items);

        const isConsumidorFinal = !docData.customer.ruc || docData.customer.taxType === '02';

        // TipoEmision: Contribuyente Previo (01) | Consumidor Final Posterior (03)
        const tipoEmision = isConsumidorFinal ? '03' : '01';

        // Receptor
        const receptorRuc = isConsumidorFinal ? 'CF' : docData.customer.ruc;
        const receptorDv = isConsumidorFinal ? '' : (docData.customer.dv || '');

        // En ambiente TEST Digifact requiere usar su propio RUC de sandbox
        const authRuc = this.environment === 'TEST' ? '155704849-2-2021' : this.rucEmisor;
        const authDv = this.environment === 'TEST' ? '32' : (this.dvEmisor || '00');

        // En ambiente TEST Digifact exige este nombre específico para el emisor
        const emisorName = this.environment === 'TEST'
            ? 'FE generada en ambiente de pruebas - sin valor comercial ni fiscal'
            : (this.config.razonSocial || 'Emisor');

        // Generar código de seguridad aleatorio de 9 dígitos (AI06)
        const codigoSeguridad = String(Math.floor(Math.random() * 999999998) + 1).padStart(9, '0');

        // Número correlativo de la FE (AI04) - derivado del número de documento
        const numeroDF = String(docData.documentNumber || '1').padStart(10, '0');

        // DocType: 01=Factura, 04=Nota de Crédito
        const docType = docData.docType === 'C' ? '04' : '01';

        // Construir arreglo base de ID adicionales para comprador
        let buyerTaxIDAdditionalInfo = [
            { "Name": "TipoReceptor", "Data": null, "Value": isConsumidorFinal ? "02" : "01" } // CI01
        ];

        if (!isConsumidorFinal && receptorDv) {
            buyerTaxIDAdditionalInfo.push({ "Name": "DigitoVerificador", "Data": null, "Value": receptorDv });
        }

        // Tipo de ID del receptor: 01=Natural, 02=Jurídico, 03=Pasaporte, 04=Extranjero
        const taxIdType = docData.customer.taxType || (isConsumidorFinal ? "01" : "02");

        const buyerObj = {
            "TaxID": receptorRuc,                // C02
            "TaxIDType": taxIdType,
            "TaxIDAdditionalInfo": buyerTaxIDAdditionalInfo,
            "Name": isConsumidorFinal ? "Consumidor Final" : (docData.customer.name || ""),
            "AdditionlInfo": [
                { "Name": "PaisReceptorFE", "Data": null, "Value": "PA" } // CI08
            ]
        };

        if (!isConsumidorFinal) {
            buyerObj.AddressInfo = {
                "Address": docData.customer.address || "Ciudad de Panama",
                "City": "Panama",
                "District": "Panama",
                "State": "Panama",
                "Country": "PA"
            };
        }

        const nucJson = {
            "Version": "1.0",
            "CountryCode": "PA",
            "Header": {
<<<<<<< HEAD
                "DocType": docType,                  // A02: Tipo de documento
                "IssuedDateTime": new Date().toISOString().replace('Z', '-05:00'), // A03
                "AdditionalIssueType": this.environment === 'TEST' ? "2" : "1",   // A04: 2=Pruebas, 1=Producción
                "AdditionalIssueDocInfo": [
                    { "Name": "TipoEmision", "Data": null, "Value": tipoEmision },    // AI01
                    { "Name": "NumeroDF", "Data": null, "Value": numeroDF },       // AI04
                    { "Name": "PtoFactDF", "Data": null, "Value": this.sucursal || "001" }, // AI05
                    { "Name": "CodigoSeguridad", "Data": null, "Value": codigoSeguridad }, // AI06
                    { "Name": "NaturalezaOperacion", "Data": null, "Value": "01" },           // AI08: 01=Venta interna
                    { "Name": "TipoOperacion", "Data": null, "Value": "1" },            // AI09: 1=Salida/Venta
                    { "Name": "DestinoOperacion", "Data": null, "Value": "1" },            // AI10: 1=Panamá
                    { "Name": "FormatoGeneracion", "Data": null, "Value": "1" },            // AI11: 1=Sin CAFE
                    { "Name": "ManeraEntrega", "Data": null, "Value": "1" },            // AI12: 1=Sin CAFE
                    { "Name": "EnvioContenedor", "Data": null, "Value": "1" },            // AI13: 1=Normal
                    { "Name": "ProcesoGeneracion", "Data": null, "Value": "1" }             // AI14: 1=Sistema propio
                ]
=======
                "DocType": docData.docType === 'C' ? "04" : "01",
                "IssuedDateTime": new Date().toISOString(),
                "AdditionalIssueType": "01",
                "AdditionalIssueDocInfo": [{}],
                
                // DGI original A block
                "A02": "1", // Versión del formato
                "A03": "PA", // Código del país
                "A04": this.environment === 'TEST' ? "1" : "2", // 1=Pruebas, 2=Prod
                "A05": tipoEmision, // Tipo de Emisión (01 Previa, 03 Posterior)
                "A06": docData.documentNumber // Número interno
>>>>>>> 8bb73e6ad2535b6f0afba9cc17a3545f22ae1854
            },
            "Seller": {
                "TaxID": authRuc,                    // B02
                "TaxIDType": "2",                    // B03: 2=Jurídico
                "TaxIDAdditionalInfo": [
                    { "Name": "DigitoVerificador", "Data": null, "Value": authDv }  // BI01
                ],
                "Name": emisorName,                  // B05
                "Contact": {
                    "PhoneList": { "Phone": [this.config.telefono || "6000-0000"] },
                    "EmailList": { "Email": [this.config.email || "facturacion@empresa.com"] }
                },
<<<<<<< HEAD
                "BranchInfo": {
                    "Code": this.sucursal || "0000", // B071
                    "AddressInfo": {
                        "Address": this.config.direccion || "Ciudad de Panama",
                        "City": this.config.corregimiento || "San Felipe",
                        "District": this.config.distrito || "Panama",
                        "State": this.config.provincia || "Panama",
                        "Country": "PA"
                    },
                    "AdditionalBranchInfo": [
                        { "Name": "CoordEm", "Data": null, "Value": this.config.coordenadas || "+08.9939,-79.5197" }, // BI02
                        { "Name": "CodUbi", "Data": null, "Value": this.config.codUbi || "8-8-1" } // BI03
                    ]
                }
=======
                
                // DGI original B block
                "B01": authRuc,
                "B02": this.dvEmisor,
                "B03": this.config.razonSocial,
                "B07": this.sucursal || "0000",
                "B08": this.config.direccion || "Ciudad de Panama"
            },
            "Buyer": {
                "TaxID": receptorRuc,
                "TaxIDType": "01",
                "TaxIDAdditionalInfo": [{ "Value": receptorDv || "00" }],
                "AdditionlInfo": [{}],

                // DGI original C block
                "C01": isConsumidorFinal ? "02" : "01", 
                "C02": receptorRuc,
                "C03": receptorDv,
                "C05": docData.customer.name,
                "C08": docData.customer.address || "Ciudad de Panamá"
            },
            "Items": docData.items.map((item, index) => ({
                "Price": Number(item.price || item.unitPrice),
                "Totals": { "Amount": Number(item.total), "Tax": Number(item.total * item.taxRate), "TotalItem": Number(item.total * (1 + item.taxRate)) },
                "Description": item.description,
                "Qty": Number(item.quantity),
                "Taxes": { "Code": "01", "Rate": Number(item.taxRate * 100), "Amount": Number(item.total * item.taxRate) },
                
                // DGI original E block items
                "E011": (index + 1).toString(), // Secuencia
                "E012": item.description,
                "E014": Number(item.quantity).toFixed(2),
                "E015": Number(item.price || item.unitPrice).toFixed(4),
                "E019": Number(item.total).toFixed(2),
                "E09": {
                    "E091": {
                        "E0911": this.mapItbmsCode(item.taxRate)
                    }
                }
            })),
            "Totals": {
                "GrandTotal": { "Amount": Number(totalAmount.toFixed(2)), "InvoiceTotal": Number(totalAmount.toFixed(2)) },
                
                // DGI original F block
                "F01": "1", 
                "F03": totalTaxable.toFixed(2),
                "F04": totalTax.toFixed(2),
                "F05": totalAmount.toFixed(2) // Total Neto
>>>>>>> 8bb73e6ad2535b6f0afba9cc17a3545f22ae1854
            },
            "Buyer": buyerObj,
            "Items": docData.items.map((item, index) => {
                const unitPrice = Number(item.price || item.unitPrice || 0);
                const qty = Number(item.quantity || 1);
                const subtotal = Number(item.subtotal || (unitPrice * qty));
                const taxRate = Number(item.taxRate || 0);
                const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
                const totalItem = parseFloat((subtotal + taxAmount).toFixed(2));

                const itemObj = {
                    "Description": item.description || item.name,    // E04
                    "Qty": qty,                               // E05
                    "Price": unitPrice,                         // E07
                    "Taxes": {
                        "Tax": [
                            {
                                "Code": this.mapItbmsCode(taxRate * 100), // E0911
                                "Description": taxRate > 0 ? "ITBMS" : "Exento", // E0912
                                "Amount": taxAmount                          // E0914
                            }
                        ]
                    },
                    "Totals": {
                        "TotalItem": totalItem                        // E116
                    }
                };

                return itemObj;
            }),
            "Totals": {
                "QtyItems": docData.items.length,    // F02: Cantidad de líneas de ítems
                "GrandTotal": {
                    "SubTotalTax": parseFloat(totalTaxable.toFixed(2)),  // F051: Subtotal gravado
                    "TotalTax": parseFloat(totalTax.toFixed(2)),      // F052: Total ITBMS
                    "InvoiceTotal": parseFloat(totalAmount.toFixed(2))    // F053: Total factura
                }
            },
            "Payments": [
                { "Type": "01", "Amount": parseFloat(totalAmount.toFixed(2)) }  // G021: 01=Crédito/Contado
            ],
            "AdditionalDocumentInfo": {
                "AdditionalInfo": [
                    {
                        "AditionalInfo": [
                            { "Name": "TiempoPago", "Data": null, "Value": "1" } // HI06: 1=Contado
                        ]
                    }
                ]
            }
        };

<<<<<<< HEAD
        // Nota de Crédito: agregar referencia al documento original
        if (docData.docType === 'C' && docData.invoiceNumber) {
            nucJson.Header.AdditionalIssueDocInfo.push(
                { "Name": "NumDocRef", "Data": null, "Value": docData.invoiceNumber },
                { "Name": "FechaDocRef", "Data": null, "Value": docData.invoiceNumberRefDate || new Date().toISOString().split('T')[0] },
                { "Name": "MotivoAnulacion", "Data": null, "Value": "01" } // 01=Error datos
            );
=======
        // If it's a Credit Note, add References (G)
        if (docData.docType === 'C') {
            nucJson.G = {
                "G01": {
                    "G011": "1", 
                    "G012": docData.invoiceNumber, 
                    "G014": docData.invoiceNumberRefDate 
                }
            };
>>>>>>> 8bb73e6ad2535b6f0afba9cc17a3545f22ae1854
        }

        return nucJson;
    }


    /**
     * Executes an API request to Digifact with automatic token renewal on 401.
     */
    async executeRequest(url, method, queryParams, body) {
        let token = await this.getToken();

        let queryString = new URLSearchParams(queryParams).toString();
        let fullUrl = queryString ? `${url}?${queryString}` : url;

        console.log(`[DEBUG-DIGIFACT] Executing: ${method} ${fullUrl}`);
        if (body) console.log(`[DEBUG-DIGIFACT] Payload (Length: ${JSON.stringify(body).length}):`, JSON.stringify(body).substring(0, 200) + '...');

        const makeCall = async (authToken) => {
            console.log(`[DEBUG-DIGIFACT] Auth Token starts with: ${authToken.substring(0, 15)}...`);
            return await fetch(fullUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken
                },
                body: body ? JSON.stringify(body) : undefined
            });
        };

        let response = await makeCall(token);

        // If 401 Unauthorized, token might have expired or been revoked
        if (response.status === 401) {
            console.log(`🔄 Token expirado (401). Headers recibidos:`, Object.fromEntries(response.headers.entries()));
            console.log(`🔄 Full URL que falló: ${fullUrl}`);
            const errorBody = await response.text();
            console.log(`🔄 Body error: ${errorBody}`);

            console.log('🔄 Solicitando uno nuevo...');
            token = await this.getToken(true); // Force refresh
            response = await makeCall(token);  // Retry
            if (response.status === 401) {
                const err2 = await response.text();
                console.log(`❌ Segundo intento falló 401 con: ${err2}`);
            }
        }

        return response;
    }

    /**
     * Implements signAndSend from PACAdapter API.
     */
    async signAndSend(documentData) {
        try {
            const nucJsonPayload = this.mapToNucJson(documentData);

            // Endpoint: /api/v2/transform/nuc_json
            const transformUrl = `${this.baseUrl}/api/v2/transform/nuc_json`;
            const authRuc = this.environment === 'TEST' ? '155704849-2-2021' : this.rucEmisor;
            const queryParams = {
                "TAXID": authRuc,
                "FORMAT": "XML|HTML|PDF",
                "USERNAME": this.pacUsername
            };

            console.log(`📡 Certificando doc ${documentData.documentNumber} en Digifact...`);

            const response = await this.executeRequest(transformUrl, 'POST', queryParams, nucJsonPayload);
            const resultText = await response.text();

            if (!response.ok) {
                console.error(`❌ Error Digifact [${response.status}]:`, resultText);
                return {
                    success: false,
                    status: 'REJECTED',
                    error: `Error HTTP ${response.status}: ${resultText}`
                };
            }

            let result;
            try {
                result = JSON.parse(resultText);
            } catch (e) {
                // Si devuelven el XML directamente en vez de JSON, manejarlo aquí.
                // Según la especificación retornará JSON con responseData1 (XML), responseData2 (HTML), responseData3 (PDF). 
                throw new Error("Respuesta no válida del servicio de certificación");
            }

            // Validar si la respuesta indica éxito según la estructura de Digifact V2.0.4
            // Generalmente, 'authNumber' indica éxito al generar CUFE
            if (result && result.authNumber) {
                console.log(`✅ Documento Autorizado. CUFE: ${result.authNumber}`);
                return {
                    success: true,
                    cufe: result.authNumber,  // El UUID / CUFE
                    xmlSigned: result.responseData1, // String codificado de retorno del XML si está
                    qr: null, // Queda en el PDF normalmente o como un data interno
                    pdfBase64: result.responseData3, // PDF en string Base64 devuelto por la API
                    authDate: new Date(),
                    status: 'AUTHORIZED',
                    protocoloAutorizacion: result.additionalInfo?.ProtocoloAutorizacion // Dato específico para previas
                };
            } else {
                // Puede ser que devuelva código de error interno 
                return {
                    success: false,
                    status: 'REJECTED',
                    error: result.message || JSON.stringify(result)
                };
            }

        } catch (error) {
            console.error("❌ Digifact Adapter Error:", error);
            return {
                success: false,
                status: 'ERROR',
                error: error.message
            };
        }
    }

    async checkStatus(txId) {
        // Implementación futura si es necesario
        throw new Error("Not implemented yet");
    }

    async voidDocument(cufe, reason) {
        // Implementación de API de anulación de Digifact futura
        throw new Error("Not implemented yet");
    }
}

module.exports = DigifactAdapter;
