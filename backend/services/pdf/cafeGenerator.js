const PdfPrinter = require('pdfmake');
const QRCode = require('qrcode');

// Define fonts - standard fonts included in pdfmake
 * @param {Object} data Document data object
 * @returns {Promise<Buffer>} PDF Buffer
 */
const generateCafePdf = async (data) => {
    try {
        // 1. Prepare QR Code
        const qrCodeUrl = data.qrUrl || 'NO_QR_DATA';
        const qrBuffer = await QRCode.toDataURL(qrCodeUrl);

        // 2. Prepare Logo (if any)
        // We assume docData.issuer (from FE_IssuerConfig) doesn't have logo, 
        // but maybe we pass it in docData.logo
        let logoContent = null;
        if (data.logo) {
            // If data.logo is already a buffer or base64
            logoContent = data.logo;
        }

        const isNC = data.docType === '03';
        const docTitle = isNC ? 'NOTA DE CRÉDITO ELECTRÓNICA' : 'FACTURA ELECTRÓNICA';

        const docDefinition = {
            pageSize: 'LETTER',
            pageMargins: [40, 40, 40, 60],
            content: [
                // Header: Logo & Issuer Info
                {
                    columns: [
                        {
                            width: 100,
                            stack: logoContent ? [
                                { image: logoContent, width: 80 }
                            ] : [
                                { text: 'LOGO', style: 'placeholderLogo' }
                            ]
                        },
                        {
                            width: '*',
                            margin: [10, 0, 0, 0],
                            stack: [
                                { text: (data.issuer.razonSocial || 'EMPRESA').toUpperCase(), style: 'headerIssuer' },
                                { text: `RUC: ${data.issuer.ruc}   DV: ${data.issuer.dv}`, style: 'subHeaderIssuer' },
                                { text: `Dirección: ${data.issuer.direccion}`, style: 'small' },
                                { text: `Sucursal: ${data.issuer.sucursal || '0000'} | P. Venta: ${data.issuer.puntoDeVenta || '01'}`, style: 'small' }
                            ]
                        },
                        {
                            width: 180,
                            stack: [
                                { text: docTitle, style: 'docTitle', alignment: 'right' },
                                { text: `No. ${data.documentNumber}`, style: 'docNumber', alignment: 'right' },
                                { text: `Fecha: ${data.issueDate}`, style: 'small', alignment: 'right', margin: [0, 5, 0, 0] }
                            ]
                        }
                    ]
                },
                { text: '\n' },

                // Gray Info Box (Datos Generales)
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{
                                fillColor: '#f8f9fa',
                                border: [false, true, false, true],
                                margin: [5, 5, 5, 5],
                                columns: [
                                    {
                                        width: '*',
                                        stack: [
                                            { text: 'DATOS DEL RECEPTOR', style: 'sectionHeader' },
                                            { text: data.customer.name, bold: true, fontSize: 11 },
                                            { text: `RUC/Cédula: ${data.customer.ruc || 'N/A'}`, fontSize: 9 },
                                            { text: `Dirección: ${data.customer.address || 'N/A'}`, fontSize: 8, color: '#666' }
                                        ]
                                    },
                                    {
                                        width: 150,
                                        stack: [
                                            { text: 'DETALLES DE PAGO', style: 'sectionHeader' },
                                            { text: `Condición: ${data.paymentMethod || 'Contado'}`, fontSize: 9 },
                                            { text: `Moneda: ${data.currency || 'USD'}`, fontSize: 9 }
                                        ]
                                    }
                                ]
                            }]
                        ]
                    },
                    layout: { hLineColor: '#dee2e6', hLineWidth: () => 1 }
                },
                { text: '\n' },

                // Items Table
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 'auto'],
                        body: [
                            [
                                { text: 'Cant', style: 'tableHeader' },
                                { text: 'Descripción', style: 'tableHeader' },
                                { text: 'Precio', style: 'tableHeader', alignment: 'right' },
                                { text: 'Desc.', style: 'tableHeader', alignment: 'right' },
                                { text: 'Total', style: 'tableHeader', alignment: 'right' }
                            ],
                            ...data.items.map(item => [
                                { text: item.quantity, fontSize: 9, margin: [0, 3] },
                                { text: item.description, fontSize: 9, margin: [0, 3] },
                                { text: Number(item.price).toFixed(2), alignment: 'right', fontSize: 9, margin: [0, 3] },
                                { text: Number(item.discount || 0).toFixed(2), alignment: 'right', fontSize: 9, margin: [0, 3] },
                                { text: Number(item.total).toFixed(2), alignment: 'right', fontSize: 9, margin: [0, 3], bold: true }
                            ])
                        ]
                    },
                    layout: {
                        hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 2 : 1,
                        vLineWidth: () => 0,
                        hLineColor: (i) => i === 1 ? '#000000' : '#dee2e6',
                        paddingLeft: () => 5,
                        paddingRight: () => 5
                    }
                },
                { text: '\n' },

                // Totals & QR Section
                {
                    columns: [
                        {
                            width: '*',
                            stack: [
                                isNC && data.referencedInvoices ? [
                                    { text: 'DOCUMENTOS REFERENCIADOS', style: 'sectionHeader' },
                                    {
                                        table: {
                                            widths: ['*', 'auto'],
                                            body: [
                                                [{ text: 'Factura No.', style: 'smallBold' }, { text: 'Fecha', style: 'smallBold' }],
                                                ...data.referencedInvoices.map(ref => [
                                                    { text: ref.number, fontSize: 8 },
                                                    { text: ref.date, fontSize: 8 }
                                                ])
                                            ]
                                        },
                                        layout: 'lightHorizontalLines'
                                    },
                                    { text: '\n' }
                                ] : [],
                                {
                                    columns: [
                                        { width: 80, image: qrBuffer, fit: [80, 80] },
                                        {
                                            width: '*',
                                            margin: [10, 5, 0, 0],
                                            stack: [
                                                { text: 'CUFE:', bold: true, fontSize: 7 },
                                                { text: data.cufe || 'PENDIENTE', fontSize: 7, font: 'Courier', color: '#444' },
                                                { text: '\nProtocolo de Autorización:', bold: true, fontSize: 7 },
                                                { text: data.protocol || 'Ver portal DGI', fontSize: 7 },
                                                { text: '\nConsulte la validez escaneando el QR.', fontSize: 7, italics: true, color: '#666' }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            width: 180,
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [{ text: 'Subtotal:', fontSize: 10, alignment: 'right', margin: [0, 2] }, { text: Number(data.totals.totalTaxable || 0).toFixed(2), alignment: 'right', fontSize: 10, margin: [0, 2] }],
                                    [{ text: 'ITBMS (7%):', fontSize: 10, alignment: 'right', margin: [0, 2] }, { text: Number(data.totals.totalTax || 0).toFixed(2), alignment: 'right', fontSize: 10, margin: [0, 2] }],
                                    [{ text: 'Total a Pagar:', style: 'totalLabel' }, { text: Number(data.totals.totalAmount || 0).toFixed(2), style: 'totalValue' }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                }
            ],
            footer: (currentPage, pageCount) => {
                return {
                    stack: [
                        { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 572, y2: 0, lineWidth: 0.5, color: '#dee2e6' }] },
                        {
                            columns: [
                                { text: 'Generado por CBTECH ERP', fontSize: 7, color: '#999', margin: [40, 5] },
                                { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 7, color: '#999', margin: [0, 5, 40, 0] }
                            ]
                        }
                    ]
                };
            },
            styles: {
                headerIssuer: { fontSize: 12, bold: true, color: '#000' },
                subHeaderIssuer: { fontSize: 9, bold: true, color: '#333' },
                placeholderLogo: { fontSize: 20, bold: true, color: '#ddd', margin: [0, 10] },
                docTitle: { fontSize: 14, bold: true, color: '#000' },
                docNumber: { fontSize: 14, bold: true, color: '#004085' },
                sectionHeader: { fontSize: 8, bold: true, color: '#495057', margin: [0, 0, 0, 3], characterSpacing: 1 },
                tableHeader: { bold: true, fontSize: 9, color: 'white', fillColor: '#000000', margin: [0, 3] },
                totalLabel: { fontSize: 12, bold: true, alignment: 'right', margin: [0, 5, 0, 0] },
                totalValue: { fontSize: 14, bold: true, alignment: 'right', color: '#000', margin: [0, 3, 0, 0] },
                small: { fontSize: 8, color: '#444' },
                smallBold: { fontSize: 8, bold: true }
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 10
            }
        };

        const pdfDoc = printer.createPdfKitDocument(docDefinition);

        return new Promise((resolve, reject) => {
            const chunks = [];
            pdfDoc.on('data', (chunk) => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', (err) => reject(err));
            pdfDoc.end();
        });

    } catch (error) {
        console.error('Error generating CAFE PDF:', error);
        throw error;
    }
};

module.exports = { generateCafePdf };

