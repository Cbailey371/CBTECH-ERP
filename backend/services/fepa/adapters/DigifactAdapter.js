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
        const rate = Math.round(parseFloat(taxRate) || 0);
        if (rate === 7) return '01';  // 7% - ITBMS estándar
        if (rate === 10) return '02';  // 10%
        if (rate === 15) return '03';  // 15%
        return '00'; // Exento o no aplica
    }

    /**
     * Maps internal ERP document data to Digifact NUC-JSON v2.0.8 format.
     */
    mapToNucJson(docData) {
        const { totalTaxable, totalTax, totalAmount } = calculateTaxes(docData.items);
        const totalDocument = Number(totalAmount.toFixed(2));

        // 1. DETERMINAR PERFIL DEL CLIENTE (Basado en el modelo Customer del ERP)
        const receptorTipo = docData.customer.tipoReceptor || "01";
        const isGobierno = (receptorTipo === "03");
        const isExtranjero = (receptorTipo === "04" || docData.customer.taxId === "EXTRANJERO");
        const isConsumidorFinal = (receptorTipo === "02" || docData.customer.taxId === "CF");

        // 2. CONFIGURACIÓN DE TIPO DE DOCUMENTO Y EMISIÓN
        const docTypeBase = (docData.docType === '03' || docData.docType === 'C') ? 'NC' : ((docData.docType === '04' || docData.docType === 'D') ? 'ND' : 'FAC');
        
        let docType = '01';
        if (docTypeBase === 'FAC') docType = '01'; 
        if (docTypeBase === 'NC') docType = '03';
        if (docTypeBase === 'ND') docType = '04';

        const tipoEmision = isConsumidorFinal ? '03' : '01';
        const additionalIssueType = this.environment === 'TEST' ? 2 : 1;
        const ptoFactDF = this.environment === 'TEST' ? "987" : (this.sucursal || "001");
        const numeroDF = this.environment === 'TEST' ? "0020269999" : String(docData.documentNumber || '1').replace(/\D/g, '').slice(-10).padStart(10, '0');
        const codigoSeguridad = String(Math.floor(Math.random() * 999999998) + 1).padStart(9, '0');

        // 3. DATOS DEL EMISOR Y RECEPTOR (REGLAS TEST)
        const authRuc = this.environment === 'TEST' ? '155704849-2-2021' : this.rucEmisor;
        const authDv = this.environment === 'TEST' ? '32' : (this.dvEmisor || '00');
        const emisorName = this.environment === 'TEST' ? 'FE generada en ambiente de pruebas - sin valor comercial ni fiscal' : (this.config.razonSocial || 'Emisor');

        const taxIdType = isExtranjero ? null : "2"; 
        const finalTaxId = isExtranjero ? "EXTRANJERO" : (isConsumidorFinal ? "CF" : docData.customer.taxId?.replace(/\s/g, ''));
        
        let buyerTaxIDAdditionalInfo = [{ "Name": "TipoReceptor", "Data": null, "Value": receptorTipo }];

        if (!isExtranjero) {
            if (docData.customer.dv) buyerTaxIDAdditionalInfo.push({ "Name": "DigitoVerificador", "Data": null, "Value": String(docData.customer.dv) });
            buyerTaxIDAdditionalInfo.push({ "Name": "CodUbi", "Data": null, "Value": docData.customer.codUbi || (this.environment === 'TEST' ? "1-1-1" : "8-8-1") });
        } else {
            buyerTaxIDAdditionalInfo.push({ "Name": "CodUbi", "Data": null, "Value": "1-1-2" });
            buyerTaxIDAdditionalInfo.push({ "Name": "NumPasaporte", "Data": null, "Value": docData.customer.taxId || "PASAPORTE" });
            buyerTaxIDAdditionalInfo.push({ "Name": "PaisExt", "Data": null, "Value": docData.customer.paisReceptor || "US" });
        }

        // 4. CONSTRUCCIÓN DEL OBJETO BUYER (COMPRADOR)
        let buyerObj = {
            "TaxID": finalTaxId,
            "TaxIDType": taxIdType,
            "TaxIDAdditionalInfo": buyerTaxIDAdditionalInfo,
            "Name": isConsumidorFinal ? "Consumidor Final" : (docData.customer.name || "Cliente"),
            "AdditionlInfo": [ // Nota: misspelling "AdditionlInfo" es intencional según ejemplos
                { "Name": "PaisReceptorFE", "Data": null, "Value": "PA" }
            ],
            "AddressInfo": {
                "Address": docData.customer.address || "CIUDAD DE PANAMA",
                "City": docData.customer.city || "PANAMA",
                "District": docData.customer.district || "PANAMA",
                "State": docData.customer.state || "PANAMA",
                "Country": "PA"
            }
        };

        // 5. CONSTRUCCIÓN DEL JSON NUC (v2.0.8)
        const nucJson = {
            "Version": "1.00",
            "CountryCode": "PA",
            "Header": {
                "DocType": docType,
                "IssuedDateTime": (() => {
                    const now = new Date();
                    const panamaTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
                    return panamaTime.toISOString().split('.')[0] + '-05:00';
                })(),
                "AdditionalIssueType": additionalIssueType,
                "Currency": null,
                "AdditionalIssueDocInfo": [
                    { "Name": "TipoEmision", "Data": null, "Value": tipoEmision },
                    { "Name": "NumeroDF", "Data": null, "Value": numeroDF },
                    { "Name": "PtoFactDF", "Data": null, "Value": ptoFactDF },
                    { "Name": "CodigoSeguridad", "Data": null, "Value": codigoSeguridad },
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
                "TaxID": authRuc,
                "TaxIDType": "2",
                "TaxIDAdditionalInfo": [
                    { "Name": "DigitoVerificador", "Data": null, "Value": authDv }
                ],
                "Name": emisorName,
                "Contact": {
                    "PhoneList": { "Phone": [this.config.telefono || "6000-0000"] },
                    "EmailList": null
                },
                "BranchInfo": {
                    "Code": "0001",
                    "Name": null,
                    "AddressInfo": {
                        "Address": (this.config.direccion || "Ciudad de Panama"),
                        "City": (this.config.corregimiento || "Panama"),
                        "District": (this.config.distrito || "Panama"),
                        "State": (this.config.provincia || "Panama"),
                        "Country": "PA"
                    },
                    "AdditionalBranchInfo": [
                        { "Name": "CoordEm", "Data": null, "Value": this.config.coordenadas || "+8.9892,-79.5201" },
                        { "Name": "CodUbi", "Data": null, "Value": this.config.codUbi || (this.environment === 'TEST' ? "1-1-1" : "8-8-1") }
                    ]
                }
            },
            "Buyer": buyerObj,
            "Items": docData.items.map((item) => {
                const unitPrice = parseFloat(Number(item.price || item.unitPrice || 0).toFixed(6));
                const qty = parseFloat(Number(item.quantity || 1).toFixed(2));
                const subtotal = parseFloat((unitPrice * qty).toFixed(2));
                const taxRate = Number(item.taxRate || 0);
                const taxAmount = parseFloat((subtotal * taxRate).toFixed(6));
                const totalWTaxes = parseFloat((subtotal + taxAmount).toFixed(6));

                return {
                    "Codes": [
                        { "Name": "CodigoProd", "Data": null, "Value": item.code || "1234567890" },
                        { "Name": "CodCPBSabr", "Data": null, "Value": "13" }, 
                        { "Name": "CodCPBScmp", "Data": null, "Value": "1310" }
                    ],
                    "Description": item.description || item.name,
                    "Qty": qty,
                    "UnitOfMeasure": "und",
                    "Price": unitPrice,
                    "Taxes": { "Tax": [{ "Code": this.mapItbmsCode(taxRate * 100), "Description": "ITBMS", "Amount": taxAmount }] },
                    "Totals": {
                        "TotalBTaxes": subtotal,
                        "TotalWTaxes": totalWTaxes,
                        "SpecificTotal": totalWTaxes,
                        "TotalItem": totalWTaxes
                    }
                };
            }),
            "Totals": {
                "QtyItems": docData.items.length,
                "GrandTotal": {
                    "TotalBTaxes": Number(totalTaxable.toFixed(2)),
                    "TotalWTaxes": totalDocument,
                    "InvoiceTotal": totalDocument
                }
            },
            "Payments": [
                { "Type": "01", "Amount": totalDocument }
            ],
            "AdditionalDocumentInfo": {
                "AdditionalInfo": [
                    {
                        "AditionalInfo": [
                            { "Name": "TiempoPago", "Data": null, "Value": "1" }
                        ]
                    }
                ]
            }
        };

        // 6. REFERENCIA PARA NOTA DE CRÉDITO (REFINADO SEGÚN NUC 2)
        if (docType === '03') {
            const cufeFinal = (docData.cufeRef || docData.invoiceNumber || '').trim();
            nucJson.AdditionalDocumentInfo.AdditionalInfo[0].AditionalData = {
                "Data": [{
                    "Info": [
                        { "Name": "NombEmRef", "Data": null, "Value": emisorName },
                        { "Name": "FechaDFRef", "Data": null, "Value": (() => {
                            try {
                                const d = new Date(docData.invoiceNumberRefDate || docData.originalDate);
                                if (isNaN(d.getTime())) return String(docData.invoiceNumberRefDate);
                                return d.toISOString().split('.')[0] + '-05:00';
                            } catch (e) {
                                return String(docData.invoiceNumberRefDate);
                            }
                        })() },
                        { "Name": "CUFERef", "Data": null, "Value": cufeFinal }
                    ],
                    "Name": null
                }]
            };
        }

        console.log("== SENDING TO DIGIFACT NUC Header ==");
        console.log(JSON.stringify(nucJson.Header, null, 2));
        console.log("== SENDING TO DIGIFACT NUC Buyer ==");
        console.log(JSON.stringify(nucJson.Buyer, null, 2));

        return nucJson;
    }

    async executeRequest(url, method, queryParams, body) {
        let token = await this.getToken();
        let queryString = new URLSearchParams(queryParams).toString();
        let fullUrl = queryString ? `${url}?${queryString}` : url;

        const makeCall = async (authToken) => {
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
        if (response.status === 401) {
            token = await this.getToken(true);
            response = await makeCall(token);
        }
        return response;
    }

    async signAndSend(documentData) {
        try {
            const nucJsonPayload = this.mapToNucJson(documentData);
            const transformUrl = `${this.baseUrl}/api/v2/transform/nuc_json`;
            const authRuc = this.environment === 'TEST' ? '155704849-2-2021' : this.rucEmisor;
            const queryParams = {
                "TAXID": authRuc,
                "FORMAT": "XML|HTML|PDF",
                "USERNAME": this.pacUsername
            };

            const response = await this.executeRequest(transformUrl, 'POST', queryParams, nucJsonPayload);
            const resultText = await response.text();
            console.log("== RAW DIGIFACT RESPONSE ==");
            console.log(resultText);
            console.log("============================");

            if (!response.ok) {
                return {
                    success: false,
                    status: 'REJECTED',
                    error: `Error HTTP ${response.status}: ${resultText}`
                };
            }

            const result = JSON.parse(resultText);
            if (result && result.authNumber) {
                // Intentar extraer el contenido del QR del XML si es posible, 
                // ya que el usuario indica que la URL de consulta no es suficiente.
                let finalQr = result.qrCodeUrl;
                if (result.responseData1) {
                    try {
                        const xmlDecoded = Buffer.from(result.responseData1, 'base64').toString('utf8');
                        const qrMatch = xmlDecoded.match(/<CodigoQR>([^<]+)<\/CodigoQR>/);
                        if (qrMatch && qrMatch[1]) {
                            finalQr = qrMatch[1];
                        }
                    } catch (e) {
                        console.error("Error extrayendo QR del XML:", e);
                    }
                }

                return {
                    success: true,
                    cufe: result.authNumber,
                    qr: finalQr, 
                    xmlSigned: result.responseData1,
                    htmlContent: result.responseData2,
                    pdfBase64: result.responseData3,
                    authDate: result.issuedTimeStamp ? new Date(result.issuedTimeStamp) : new Date(),
                    status: 'AUTHORIZED',
                    protocol: result.authProtocol || result.authorizationProtocol || null
                };
            } else {
                return {
                    success: false,
                    status: 'REJECTED',
                    error: result.message || JSON.stringify(result)
                };
            }
        } catch (error) {
            return {
                success: false,
                status: 'REJECTED',
                error: `Technical Error: ${error.message}`
            };
        }
    }

    async checkStatus(txId) { throw new Error("Not implemented yet"); }
    async voidDocument(cufe, reason) { throw new Error("Not implemented yet"); }
}

module.exports = DigifactAdapter;
