const PdfPrinter = require('pdfmake');
const QRCode = require('qrcode');

const fonts = {
    Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    },
    Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique'
    }
};

const printer = new PdfPrinter(fonts);

const generateCafePdf = async (data) => {
    try {
        // Generar QR con Alta Densidad (Error Correction Level H) para que se parezca al oficial
        const qrBuffer = await QRCode.toDataURL(data.qrUrl || 'NO_QR', { 
            errorCorrectionLevel: 'H',
            margin: 1,
            scale: 8
        });
        
        const logoContent = data.logo || null;
        const isNC = data.docType === '03';
        const docTitle = isNC ? 'NOTA DE CRÉDITO ELECTRÓNICA' : 'FACTURA ELECTRÓNICA';
        const opType = isNC ? 'Nota de crédito referente a una o varias FE' : 'Factura de operación interna';

        const docDefinition = {
            pageSize: 'LETTER',
            pageMargins: [40, 40, 40, 40],
            content: [
                // 1. TOP HEADER (Logo, DGI Center, QR Right)
                {
                    columns: [
                        {
                            width: 120,
                            stack: logoContent ? [{ image: logoContent, width: 100 }] : []
                        },
                        {
                            width: '*',
                            stack: [
                                { text: 'DGI', alignment: 'center', bold: true, fontSize: 14 },
                                { text: 'Comprobante Auxiliar de Factura Electrónica', alignment: 'center', bold: true, fontSize: 10 },
                                { text: opType, alignment: 'center', fontSize: 11, bold: true, margin: [0, 5] }
                            ]
                        },
                        {
                            width: 120,
                            stack: [
                                { image: qrBuffer, width: 100, alignment: 'right' }
                            ]
                        }
                    ]
                },
                { text: '\n' },

                // 2. ISSUER & CUSTOMER INFO
                {
                    columns: [
                        {
                            width: '*',
                            stack: [
                                { text: `Emisor: ${data.issuer.razonSocial}`, bold: true, fontSize: 9 },
                                { text: `RUC: ${data.issuer.ruc}   DV: ${data.issuer.dv}`, fontSize: 9 },
                                { text: `E-Mail: ${data.issuer.email || 'n/a'}   Teléfono: ${data.issuer.phone || 'n/a'}`, fontSize: 9 },
                                { text: `Dirección: ${data.issuer.direccion}`, fontSize: 9 }
                            ]
                        }
                    ]
                },
                { text: '\n' },
                {
                    stack: [
                        { text: `Tipo de Receptor: Contribuyente`, fontSize: 9 },
                        { text: `Cliente: ${data.customer.name}`, bold: true, fontSize: 9 },
                        { text: `RUC/Cédula/Pasaporte: ${data.customer.ruc}   DV: ${data.customer.dv || ''}`, fontSize: 9 },
                        { text: `E-Mail: ${data.customer.email || 'n/a'}`, fontSize: 9 },
                        { text: `Dirección: ${data.customer.address}`, fontSize: 9 }
                    ]
                },
                { text: '\n' },

                // 3. AUTH BOX (RESTAURADA Y CORREGIDA)
                {
                    columns: [
                        {
                            width: 150,
                            stack: [
                                { text: `Número: ${data.documentNumber}`, fontSize: 9, bold: true },
                                { text: `Fecha de Emisión: ${data.issueDate}`, fontSize: 9 },
                                { text: `Punto de Facturación: ${data.issuer.puntoDeVenta || '01'}`, fontSize: 9 }
                            ]
                        },
                        {
                            width: '*',
                            stack: [
                                { text: 'Consulte por la clave de acceso en:', fontSize: 7, color: '#555' },
                                { text: 'https://dgi-fep.mef.gob.pa/Consultas/FacturasPorCUFE', fontSize: 7, color: '#004085', margin: [0, 0, 0, 3] },
                                { text: 'CUFE:', bold: true, fontSize: 8 },
                                { text: data.cufe || 'PENDIENTE', fontSize: 8, font: 'Courier', bold: true, noWrap: false },
                                { text: `\nProtocolo de autorización: ${data.protocol && data.protocol !== 'null' ? data.protocol : 'AUTORIZADO'}`, fontSize: 8, bold: true }
                            ]
                        }
                    ]
                },
                { text: '\n' },

                // 4. ITEMS TABLE
                {
                    table: {
                        headerRows: 1,
                        widths: ['*', 25, 48, 48, 48, 38, 55],
                        body: [
                            [
                                { text: 'Descripción', style: 'tableHeader' },
                                { text: 'Cantidad', style: 'tableHeader', alignment: 'center' },
                                { text: 'Valor Unitario', style: 'tableHeader', alignment: 'right' },
                                { text: 'Descuento Unitario', style: 'tableHeader', alignment: 'right' },
                                { text: 'Monto', style: 'tableHeader', alignment: 'right' },
                                { text: 'ITBMS', style: 'tableHeader', alignment: 'right' },
                                { text: 'Valor Item', style: 'tableHeader', alignment: 'right' }
                            ],
                            ...data.items.map(item => [
                                { text: item.description, fontSize: 8 },
                                { text: item.quantity, alignment: 'center', fontSize: 8 },
                                { text: item.price.toFixed(2), alignment: 'right', fontSize: 8 },
                                { text: (item.discount / item.quantity || 0).toFixed(2), alignment: 'right', fontSize: 8 },
                                { text: (item.quantity * item.price).toFixed(2), alignment: 'right', fontSize: 8 },
                                { text: (item.total - (item.quantity * item.price) + item.discount).toFixed(2), alignment: 'right', fontSize: 8 },
                                { text: item.total.toFixed(2), alignment: 'right', fontSize: 8, bold: true }
                            ])
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },
                {
                    columns: [
                        { width: '*', text: '' },
                        { width: 100, text: 'Valor Total', bold: true, alignment: 'right', fontSize: 9, margin: [0, 5] },
                        { width: 55, text: data.totals.totalAmount.toFixed(2), bold: true, alignment: 'right', fontSize: 9, margin: [0, 5] }
                    ]
                },
                { text: '\n' },

                // 5. TAX BREAKDOWN & TOTALS
                {
                    columns: [
                        {
                            width: 250,
                            stack: [
                                { text: 'Desglose ITBMS', alignment: 'center', bold: true, fontSize: 9, background: '#f0f0f0', margin: [0, 5] },
                                {
                                    table: {
                                        widths: ['*', '*', '*'],
                                        body: [
                                            [{ text: 'Monto Base', bold: true, fontSize: 8 }, { text: '%', bold: true, fontSize: 8, alignment: 'center' }, { text: 'Impuesto', bold: true, fontSize: 8, alignment: 'right' }],
                                            ...Object.keys(data.totals.breakdown || {}).map(rate => [
                                                { text: data.totals.breakdown[rate].taxable.toFixed(2), fontSize: 8 },
                                                { text: rate === '0.00' ? 'Exento' : `${(parseFloat(rate) * 100).toFixed(0)}%`, fontSize: 8, alignment: 'center' },
                                                { text: data.totals.breakdown[rate].tax.toFixed(2), fontSize: 8, alignment: 'right' }
                                            ]),
                                            [{ text: 'Total', bold: true, fontSize: 8 }, { text: '', fontSize: 8 }, { text: data.totals.totalTax.toFixed(2), bold: true, fontSize: 8, alignment: 'right' }]
                                        ]
                                    }
                                }
                            ]
                        },
                        { width: 50, text: '' },
                        {
                            width: '*',
                            table: {
                                widths: ['*', 60],
                                body: [
                                    [{ text: 'Total Neto', fontSize: 9, alignment: 'right' }, { text: data.totals.totalTaxable.toFixed(2), alignment: 'right', fontSize: 9 }],
                                    [{ text: 'Monto Exento ITBMS', fontSize: 9, alignment: 'right' }, { text: (data.totals.breakdown['0.00']?.taxable || 0).toFixed(2), alignment: 'right', fontSize: 9 }],
                                    [{ text: 'Monto Gravado ITBMS', fontSize: 9, alignment: 'right' }, { text: (data.totals.totalTaxable - (data.totals.breakdown['0.00']?.taxable || 0)).toFixed(2), alignment: 'right', fontSize: 9 }],
                                    [{ text: 'ITBMS', fontSize: 9, alignment: 'right' }, { text: data.totals.totalTax.toFixed(2), alignment: 'right', fontSize: 9 }],
                                    [{ text: 'Total Impuesto', fontSize: 9, alignment: 'right' }, { text: data.totals.totalTax.toFixed(2), alignment: 'right', fontSize: 9 }],
                                    [{ text: 'Total', bold: true, fontSize: 11, alignment: 'right' }, { text: data.totals.totalAmount.toFixed(2), bold: true, alignment: 'right', fontSize: 11 }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                },
                { text: '\n' },

                // 6. PAYMENT INFO
                {
                    columns: [
                        {
                            width: 250,
                            stack: [
                                { text: 'Información de Pago a Plazo', alignment: 'center', bold: true, fontSize: 9, background: '#f0f0f0', margin: [0, 5] },
                                {
                                    table: {
                                        widths: [40, '*', 50],
                                        body: [
                                            [{ text: 'Cuota', bold: true, fontSize: 8 }, { text: 'Fecha de Vencimiento', bold: true, fontSize: 8 }, { text: 'Valor', bold: true, fontSize: 8, alignment: 'right' }],
                                            [{ text: '1', fontSize: 8 }, { text: data.dueDate || data.issueDate, fontSize: 8 }, { text: data.totals.totalAmount.toFixed(2), fontSize: 8, alignment: 'right' }]
                                        ]
                                    }
                                }
                            ]
                        },
                        { width: 50, text: '' },
                        {
                            width: '*',
                            stack: [
                                { text: 'Forma de Pago', alignment: 'center', bold: true, fontSize: 9, background: '#f0f0f0', margin: [0, 5] },
                                {
                                    table: {
                                        widths: ['*', 60],
                                        body: [
                                            [{ text: 'Crédito', fontSize: 9, alignment: 'right' }, { text: data.totals.totalAmount.toFixed(2), alignment: 'right', fontSize: 9 }],
                                            [{ text: 'TOTAL PAGADO', bold: true, fontSize: 9, alignment: 'right' }, { text: data.totals.totalAmount.toFixed(2), bold: true, alignment: 'right', fontSize: 9 }],
                                            [{ text: 'Vuelto', fontSize: 9, alignment: 'right' }, { text: '0.00', alignment: 'right', fontSize: 9 }]
                                        ]
                                    }
                                }
                            ]
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
                                { text: 'Documento validado por DIGIFACT SERVICIOS, S.A. con RUC: 155704849-2-2021 D.V. 32, es PAC, RESOLUCIÓN: 201-4219, de 29/06/2022.', fontSize: 6, color: '#999', margin: [40, 5] },
                                { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', fontSize: 7, color: '#999', margin: [0, 5, 40, 0] }
                            ]
                        }
                    ]
                };
            },
            styles: {
                tableHeader: { bold: true, fontSize: 8, fillColor: '#f0f0f0' }
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
