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

        // Extract credentials from config or use defaults provided for testing
        this.pacUsername = config.authData?.user || 'CBAILEY';
        this.pacPassword = config.authData?.password || 'Digifact*25';

        // Emisor data
        this.rucEmisor = config.ruc || '155704849-2-2021';
        this.dvEmisor = config.dv || '32';
        this.sucursal = config.sucursal || '0000';

        // The Digifact Username format is usually PA.<RUC>.<USERNAME>
        this.loginUsername = `PA.${this.rucEmisor}.${this.pacUsername}`;

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
        // Standard mapping for PA:
        // 00 - No Gravado / Exento
        // 01 - 7%
        // 02 - 10%
        // 03 - 15%
        if (rate === 0.07 || rate === 7) return '01';
        if (rate === 0.10 || rate === 10) return '02';
        if (rate === 0.15 || rate === 15) return '03';
        return '00'; // Default Exento
    }

    /**
     * Maps internal ERP document data to Digifact NUC-JSON v2.0.8 format
     */
    mapToNucJson(docData) {
        const { totalTaxable, totalTax, totalAmount } = calculateTaxes(docData.items);

        // Determine Receiver Type and Document Authorization Type
        const isConsumidorFinal = docData.customer.taxType === '02';

        // Contribuyente (01) -> Previa (01). Consumidor Final (02) -> Posterior (03)
        const tipoEmision = isConsumidorFinal ? '03' : '01';

        // Receiver mapping
        let receptorRuc = docData.customer.ruc;
        let receptorDv = docData.customer.dv || '';

        if (isConsumidorFinal) {
            receptorRuc = 'CF';
            receptorDv = ''; // CF doesn't use DV
        }

        const nucJson = {
            "A": {
                "A02": "1", // Versión del formato
                "A03": "PA", // Código del país
                "A04": docData.docType === 'C' ? "04" : "01", // DocType: 01=Factura, 04=Nota Crédito
                "A05": tipoEmision, // Tipo de Emisión (01 Previa, 03 Posterior)
                "A06": docData.documentNumber // Número interno
            },
            "B": {
                "B01": this.rucEmisor,
                "B02": this.dvEmisor,
                "B03": this.config.razonSocial,
                "B07": this.sucursal, // Casa Matriz etc, ej 0000
                "B08": this.config.direccion
            },
            "C": {
                "C01": isConsumidorFinal ? "02" : "01", // Tipo de Contribuyente Receptor
                "C02": receptorRuc,
                "C03": receptorDv,
                "C05": docData.customer.name,
                "C08": docData.customer.address || "Ciudad de Panamá"
            },
            "E": {
                // Mapear items. E01 es el array de ítems
                "E01": docData.items.map((item, index) => ({
                    "E011": (index + 1).toString(), // Secuencia
                    "E012": item.description,
                    "E014": Number(item.quantity).toFixed(2),
                    "E015": Number(item.price || item.unitPrice).toFixed(4),
                    "E019": Number(item.total).toFixed(2),
                    "E09": {
                        // ITBMS Node
                        "E091": {
                            "E0911": this.mapItbmsCode(item.taxRate)
                            // The API calculcates the tax amount automatically based on code and totals,
                            // but if custom calculations are needed, add them here based on E09 spec.
                        }
                    }
                }))
            },
            "F": {
                "F01": "1", // Subtotales y Totales (depende de NUC-JSON)
                "F03": totalTaxable.toFixed(2),
                "F04": totalTax.toFixed(2),
                "F05": totalAmount.toFixed(2) // Total Neto
            }
        };

        // If it's a Credit Note, add References (G)
        if (docData.docType === 'C') {
            nucJson.G = {
                "G01": {
                    "G011": "1", // 1=Referencia a factura electrónica
                    "G012": docData.invoiceNumber, // CUFE original
                    "G014": docData.invoiceNumberRefDate // Fecha de emisión original
                }
            };
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

        // If 401 Unauthorized, token might have expired or been revoked
        if (response.status === 401) {
            console.log('🔄 Token expirado (401), solicitando uno nuevo...');
            token = await this.getToken(true); // Force refresh
            response = await makeCall(token);  // Retry
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
            const queryParams = {
                "TAXID": this.rucEmisor,
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
