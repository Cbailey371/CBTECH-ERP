const PACAdapter = require('../PACAdapter');
const { calculateTaxes } = require('../../../utils/taxCalculations');

class WebPOSAdapter extends PACAdapter {
    constructor(config) {
        super(config);
        this.baseUrl = 'https://api.webpos.com.pa'; // Base URI - Update if different for SANDBOX
        // Extract credentials from config
        this.licencia = config.authData?.license || process.env.PAC_WEBPOS_LICENSE;
        this.apiKey = config.authData?.apiKey || process.env.PAC_WEBPOS_APIKEY;
        this.environment = config.environment || 'TEST'; // 'TEST' or 'PROD'
    }

    /**
     * Constructs the specific endpoint URL based on environment and credentials.
     */
    getEndpointUrl() {
        const amb = this.environment === 'PROD' ? 'prod' : 'test';
        // Endpoint format described in requirements:
        // /api/fepa/ak/v1/{amb}/sendFileToProcess/{companyLicCod}/{apiKey}
        return `${this.baseUrl}/api/fepa/ak/v1/${amb}/sendFileToProcess/${this.licencia}/${this.apiKey}`;
    }

    /**
     * Maps internal ERP document to WebPOS JSON format.
     * Note: This is a simplified mapping based on common DGI structure.
     */
    mapToPayload(docData) {
        const { totals, breakdown } = calculateTaxes(docData.items);

        return {
            "documento": {
                "tipo": docData.docType, // 01, 03, 04
                "puntoFacturacion": this.config.puntoDeVenta,
                "fechaEmision": new Date().toISOString(), // Check format required by PAC (usually ISO8601 or YYYY-MM-DDTHH:mm:ss)
                "numero": docData.documentNumber
            },
            "emisor": {
                "ruc": this.config.ruc,
                "dv": this.config.dv,
                "razonSocial": this.config.razonSocial,
                "sucursal": this.config.sucursal,
                "direccion": this.config.direccion
            },
            "receptor": {
                "ruc": docData.customer.ruc,
                "razonSocial": docData.customer.name,
                "direccion": docData.customer.address || "Ciudad de Panamá",
                "tipo": docData.customer.taxType || "01" // 01=Contribuyente, 02=Final, etc.
            },
            "items": docData.items.map(item => ({
                "descripcion": item.description,
                "cantidad": Number(item.quantity),
                "precioUnitario": Number(item.price),
                "total": Number(item.total),
                "tasaItbms": item.taxRate // 0.07, 0.10, etc.
            })),
            "totales": {
                "subtotal": totals.totalTaxable,
                "itbms": totals.totalTax,
                "total": totals.totalAmount,
                "totalItems": docData.items.length
            }
        };
    }

    /**
     * Implement signAndSend from PACAdapter.
     */
    async signAndSend(documentData) {
        if (!this.licencia || !this.apiKey) {
            throw new Error("WebPOS Adapter: Missing API Key or License Code.");
        }

        const payload = this.mapToPayload(documentData);
        const url = this.getEndpointUrl();

        try {
            console.log(`📡 Sending to WebPOS (${this.environment}):`, url);
            // Using native fetch (Node 18+)
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`WebPOS HTTP Error ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            // Normalize response Structure
            // Assuming WebPOS returns { cufe: '...', qr: '...', xml: '...', status: 'AUTHORIZED' }
            // This part depends heavily on the actual PAC response documentation.

            if (result.success || result.cufe) {
                return {
                    success: true,
                    cufe: result.cufe,
                    qr: result.qrUrl || result.qr,
                    xmlSigned: result.xml || result.xmlSigned,
                    authDate: new Date(), // Or use result.authDate
                    status: 'AUTHORIZED'
                };
            } else {
                return {
                    success: false,
                    status: 'REJECTED',
                    error: result.message || 'Unknown PAC Error'
                };
            }

        } catch (error) {
            console.error("WebPOS Adapter Error:", error);
            return {
                success: false,
                status: 'ERROR',
                error: error.message
            };
        }
    }

    async checkStatus(txId) {
        // Implementation pending PAC documentation on async polling
        throw new Error("Not implemented yet");
    }

    async voidDocument(cufe, reason) {
        // Implementation pending PAC documentation on void endpoint
        throw new Error("Not implemented yet");
    }
}

module.exports = WebPOSAdapter;
