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

        const isConsumidorFinal = !docData.customer.taxId || docData.customer.tipoReceptor === '02';

        // Manejo robusto para detectar si es una operación local (Panamá)
        const rawCountry = (docData.customer.paisReceptor || docData.customer.country || 'PA').trim().toUpperCase();
        // Eliminar tildes y ruidos comunes para comparar
        const normalizedCountry = rawCountry.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z]/g, "");
        
        const isLocalCountry = ['PA', 'PANAMA', 'RP', 'REPUBLICADEPANAMA'].includes(normalizedCountry) || rawCountry === 'PA';
        
        // REGLA: Si la operación es local (isLocalCountry), NUNCA lo tratamos como "Extranjero" 
        // para efectos de Digifact/DGI, incluso si su tipoReceptor es '04'.
        const isExtranjero = !isLocalCountry && (docData.customer.tipoReceptor === '04' || rawCountry !== '' || docData.customer.taxId === 'EXTRANJERO');

        // TipoEmision: Contribuyente Previo (01) | Consumidor Final Posterior (03)
        const tipoEmision = isConsumidorFinal ? '03' : '01';

        // Receptor
        const receptorRuc = isConsumidorFinal ? 'CF' : docData.customer.taxId;
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

        // Número correlativo de la FE (AI04)
        // En TEST usamos un secuencial alto para evitar colisiones
        const numeroDF = this.environment === 'TEST' ? "0020269999" : String(docData.documentNumber || '1')
            .replace(/\D/g, '')
            .slice(-10)
            .padStart(10, '0');

        const docTypeBase = (docData.docType === '03' || docData.docType === 'C') ? 'NC' : ((docData.docType === '04' || docData.docType === 'D') ? 'ND' : 'FAC');
        
        // REGLA: Si es Factura (FAC): 01 (Local) o 12 (Export)
        // REGLA: Si es Nota de Crédito (NC): 03 (Local) o 14 (Export)
        // REGLA: Si es Nota de Débito (ND): 04 (Local) o 13 (Export)
        let docType = '01';
        if (docTypeBase === 'FAC') docType = isExtranjero ? '12' : '01';
        if (docTypeBase === 'NC') docType = isExtranjero ? '14' : '03';
        if (docTypeBase === 'ND') docType = isExtranjero ? '13' : '04';

        // REGLA CLAVE: En Digifact Panamá TEST, DEBE ser 2 para coincidir con la URL de pruebas.
        // El error A04 nos obliga a esto.
        const additionalIssueType = this.environment === 'TEST' ? 2 : 1;

        // PtoFactDF: Para pruebas debe ser mayor a 599 (ej: 987)
        const ptoFactDF = this.environment === 'TEST' ? "987" : (this.sucursal || "001");

        // Construir arreglo base de ID adicionales para comprador
        let buyerTaxIDAdditionalInfo = [
            { "Name": "TipoReceptor", "Data": null, "Value": isConsumidorFinal ? "02" : (docData.customer.tipoReceptor || "01") } // CI01
        ];

        // Manejo específico para Extranjeros
        if (isExtranjero) {
            if (docData.customer.taxId) {
                buyerTaxIDAdditionalInfo.push({ "Name": "NumPasaporte", "Data": null, "Value": docData.customer.taxId });
            }
            buyerTaxIDAdditionalInfo.push({ "Name": "PaisExt", "Data": null, "Value": docData.customer.paisReceptor || "US" });
        } else {
            // REGLA DE EMERGENCIA: Si NO es extranjero, asegurar que NO se envíen campos de extranjero
            // que puedan activar el modo exportación accidentalmente.
            if (!isConsumidorFinal && receptorDv) {
                buyerTaxIDAdditionalInfo.push({ "Name": "DigitoVerificador", "Data": null, "Value": receptorDv });
            }
        }

        if (docData.customer.objetoRetencion) {
            buyerTaxIDAdditionalInfo.push({ "Name": "ObjetoRetencion", "Data": null, "Value": docData.customer.objetoRetencion });
        }

        // REGLA: 1=RUC (guiones), 2=Cédula (sin guiones)
        const taxIdType = (docData.customer.taxId?.includes('-')) ? "1" : (docData.customer.tipoIdentificacion 
            ? String(docData.customer.tipoIdentificacion).replace(/^0/, '') 
            : (isConsumidorFinal ? "1" : "2"));
        
        const finalTaxId = isConsumidorFinal ? "CF" : (isExtranjero ? "EXTRANJERO" : receptorRuc);

        let buyerObj = {
            "TaxID": finalTaxId,
            "TaxIDType": isExtranjero ? undefined : taxIdType,
            "TaxIDAdditionalInfo": buyerTaxIDAdditionalInfo,
            "Name": isConsumidorFinal ? "Consumidor Final" : (docData.customer.name || "Cliente Sin Nombre"),
            "Contact": null
        };

        // REGLA CLAVE: La propiedad 'AdditionlInfo' DEBE existir y tener PaisReceptorFE.
        // Si no se envía PaisReceptorFE, el PAC usa un motor de validación genérico que falla.
        buyerObj.AdditionlInfo = [
            { "Name": "PaisReceptorFE", "Data": null, "Value": docData.customer.paisReceptor || "PA" }
        ];

        // CodUbi Comprador
        if (!isExtranjero) {
            buyerTaxIDAdditionalInfo.push({ "Name": "CodUbi", "Data": null, "Value": docData.customer.codUbi || (this.environment === 'TEST' ? "1-1-1" : "8-8-1") });
        } else {
            buyerTaxIDAdditionalInfo.push({ "Name": "CodUbi", "Data": null, "Value": "1-1-2" });
        }

        // Dirección Comprador Dinámica
        if (!isConsumidorFinal) {
            const ubiParts = (docData.customer.codUbi || "").split('-');
            const provMap = {
                "1": "Bocas del Toro", "2": "Coclé", "3": "Colón", "4": "Chiriquí", "5": "Darién",
                "6": "Herrera", "7": "Los Santos", "8": "Panamá", "9": "Veraguas", "10": "Guna Yala",
                "12": "Ngäbe-Buglé", "13": "Panamá Oeste"
            };
            const provName = provMap[ubiParts[0]] || (this.environment === 'TEST' ? "Bocas del Toro" : "Panama");

            buyerObj.AddressInfo = {
                "Address": docData.customer.address || (this.environment === 'TEST' ? "Westland Mall, Vista Alegre, Arraijan" : "Direccion no especificada"),
                "City": isExtranjero ? "Ciudad Extranjera" : (docData.customer.city || (this.environment === 'TEST' ? `${provName} (Cabecera)` : provName)),
                "District": isExtranjero ? "Distrito Extranjero" : (docData.customer.district || provName),
                "State": isExtranjero ? "Estado Extranjero" : (docData.customer.state || provName),
                "Country": docData.customer.paisReceptor || "PA"
            };
        }

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
                "Currency": "USD",
                "AdditionalIssueDocInfo": [
                    { "Name": "TipoEmision", "Data": null, "Value": tipoEmision },
                    { "Name": "NumeroDF", "Data": null, "Value": numeroDF },
                    { "Name": "PtoFactDF", "Data": null, "Value": ptoFactDF },
                    { "Name": "CodigoSeguridad", "Data": null, "Value": codigoSeguridad },
                    { "Name": "NaturalezaOperacion", "Data": null, "Value": isExtranjero ? "02" : "01" },
                    { "Name": "TipoOperacion", "Data": null, "Value": "1" },
                    { "Name": "DestinoOperacion", "Data": null, "Value": isExtranjero ? "2" : "1" },
                    { "Name": "TipoTransaccion", "Data": null, "Value": "1" }
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
                        "Address": (this.config.direccion || (this.environment === 'TEST' ? "Blv Costa del Este,PH Financial Tower Piso 17" : "Ciudad de Panama")),
                        "City": (this.config.corregimiento || (this.environment === 'TEST' ? "Bocas del Toro (Cabecera)" : "San Felipe")),
                        "District": (this.config.distrito || (this.environment === 'TEST' ? "Bocas del Toro" : "Panama")),
                        "State": (this.config.provincia || (this.environment === 'TEST' ? "Bocas del Toro" : "Panama")),
                        "Country": "PA"
                    },
                    "AdditionalBranchInfo": [
                        { "Name": "CoordEm", "Data": null, "Value": this.config.coordenadas || "+8.9892,-79.5201" },
                        { "Name": "CodUbi", "Data": null, "Value": this.config.codUbi || (this.environment === 'TEST' ? "1-1-1" : "8-8-1") }
                    ]
                }
            },
            "Buyer": buyerObj,
            "ThirdParties": null,
            "Items": docData.items.map((item, index) => {
                const unitPrice = Number(item.price || item.unitPrice || 0);
                const qty = Number(item.quantity || 1);
                
                // Recalcular el subtotal siempre en caso de que la DB tenga datos legacy incorrectos
                const subtotal = parseFloat((unitPrice * qty).toFixed(2));
                
                const taxRate = Number(item.taxRate || 0);
                const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
                const totalWTaxes = parseFloat((subtotal + taxAmount).toFixed(2));
                
                const discountAmount = Number(item.discount || 0);
                const itemChargesAmount = Number(item.chargesAmount || 0);
                const totalItem = parseFloat((totalWTaxes - discountAmount + itemChargesAmount).toFixed(2));

                const itemObj = {
                    "Codes": [
                        { "Name": "CodigoProd", "Data": null, "Value": item.code || "1234567890" },
                        { "Name": "CodCPBSabr", "Data": null, "Value": item.cpbsAbr || "13" }, 
                        { "Name": "CodCPBScmp", "Data": null, "Value": item.cpbsCmp || "1310" }
                    ],
                    "Description": item.description || item.name,
                    "Qty": qty,
                    "UnitOfMeasure": item.uom === 'ud' || item.uom === 'UND' ? 'und' : (item.uom || "und"),
                    "Price": unitPrice,
                    "Discounts": discountAmount > 0 ? {
                        "Discount": [{ "Amount": discountAmount }]
                    } : null,
                    "Taxes": {
                        "Tax": [
                            {
                                "Code": this.mapItbmsCode(taxRate * 100),
                                "Description": "ITBMS",
                                "Amount": taxAmount
                            }
                        ]
                    },
                    "Charges": itemChargesAmount > 0 ? {
                        "Charge": [{ "Amount": itemChargesAmount }]
                    } : null,
                    "Totals": {
                        "TotalBTaxes": subtotal,
                        "TotalWTaxes": totalWTaxes,
                        "SpecificTotal": totalItem,
                        "TotalItem": totalItem
                    }
                };

                if (docData.customer.tipoReceptor === '03') {
                    itemObj.Codes.push({ "Name": "UnidadCPBS", "Data": null, "Value": item.uom === 'ud' || item.uom === 'UND' ? 'und' : (item.uom || "und") });
                }

                // REGLA: Info adicional del ítem solo necesaria para exportación o casos especiales de retención
                if (isExtranjero) {
                    itemObj.AdditionlInfo = [
                        { "Name": "InfEmFE", "Data": null, "Value": item.description || "ITEM" },
                        { "Name": "PrSegItem", "Data": null, "Value": String(unitPrice) }
                    ];
                }

                return itemObj;
            }),
            "Totals": {
                "QtyItems": docData.items.length,
                "GrandTotal": {
                    "TotalBTaxes": Number(totalTaxable.toFixed(2)),
                    "TotalWTaxes": Number(totalAmount.toFixed(2)),
                    "InvoiceTotal": Number(totalAmount.toFixed(2))
                }
            },
            "Payments": [
                { "Type": "01", "Amount": Number(totalAmount.toFixed(2)) }
            ],
            "AdditionalDocumentInfo": {
                "AdditionalInfo": (isExtranjero || ['C', '03', '04', '05'].includes(docData.docType)) ? [
                    {
                        "AditionalInfo": [
                            { "Name": "TiempoPago", "Data": null, "Value": "1" }
                        ]
                    }
                ] : []
            }
        };

        if (['C', '03', '04', '05'].includes(docData.docType) && docData.invoiceNumber) {
            // Extraer el numero correlativo de la factura original (ej: "0050" de "F - 2026 - 0050")
            const origNumMatch = (docData.originalDocNumber || docData.invoiceNumber).match(/(\d+)$/);
            const refNumber = origNumMatch ? origNumMatch[0].padStart(10, '0') : '0000000001';
            
            // EL POS de referencia DEBE coincidir con el POS de la factura original
            // En TEST, Digifact fuerza 987.
            const refPOS = this.environment === 'TEST' ? "987" : String(docData.originalPOS || this.config.puntoDeVenta || '001').padStart(3, '0');

            // Limpiar CUFE de prefijos (FE) y guiones para la referencia (DGI espera solo digitos)
            const cufeRaw = docData.cufeRef || docData.invoiceNumber || '';
            const cufeClean = cufeRaw.replace(/\D/g, ''); // Solo digitos

            nucJson.AdditionalDocumentInfo.AdditionalInfo[0].AditionalData = {
                "Data": [
                    {
                        "Info": [
                            { "Name": "NombEmRef", "Data": null, "Value": emisorName },
                            { "Name": "FechaDFRef", "Data": null, "Value": (() => {
                                try {
                                    const d = new Date(docData.invoiceNumberRefDate || docData.originalDate);
                                    return isNaN(d.getTime()) ? String(docData.invoiceNumberRefDate).split('T')[0] : d.toISOString().split('T')[0];
                                } catch (e) {
                                    return String(docData.invoiceNumberRefDate).split('T')[0];
                                }
                            })() },
                            { "Name": "CUFERef", "Data": null, "Value": cufeClean },
                           { "Name": "TipoDocumentoRef", "Data": null, "Value": "01" },
                            { "Name": "SerieDocRef", "Data": null, "Value": refPOS },
                            { "Name": "NumeroDocRef", "Data": null, "Value": refNumber }
                        ],
                        "Name": null
                    }
                ]
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
