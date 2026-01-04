const PdfPrinter = require('pdfmake');
const QRCode = require('qrcode');

// Define fonts - standard fonts included in pdfmake
const fonts = {
    Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
    }
};

const printer = new PdfPrinter(fonts);

/**
 * Generates a CAFE PDF stream.
 * @param {Object} data Invoice data object
 * @returns {Promise<Buffer>} PDF Buffer
 */
const generateCafePdf = async (data) => {
    try {
        // Generate QR Code Buffer
        const qrCodeUrl = data.qrUrl || 'NO_QR_DATA';
        const qrBuffer = await QRCode.toDataURL(qrCodeUrl);

        const docDefinition = {
            pageSize: 'LETTER',
            pageMargins: [40, 40, 40, 60],
            content: [
                // Header: Logo & Issuer Info
                {
                    columns: [
                        {
                            width: '*',
                            text: [
                                { text: (data.issuer.razonSocial || 'EMPRESA DEMO').toUpperCase() + '\n', style: 'headerIssuer' },
                                { text: `RUC: ${data.issuer.ruc}   DV: ${data.issuer.dv}\n`, style: 'subHeaderIssuer' },
                                { text: `Dirección: ${data.issuer.direccion}\n`, style: 'small' },
                                { text: `Sucursal: ${data.issuer.sucursal || '0000'} | P. Venta: ${data.issuer.puntoDeVenta || '01'}`, style: 'small' }
                            ]
                        },
                        {
                            width: 150,
                            stack: [
                                { text: 'FACTURA ELECTRÓNICA', style: 'docTitle', alignment: 'center' },
                                { text: `No. ${data.documentNumber}`, style: 'docNumber', alignment: 'center' },
                                { text: '\n' },
                                { text: `Fecha: ${data.issueDate}`, alignment: 'right', fontSize: 10 }
                            ]
                        }
                    ]
                },
                { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 }] },
                { text: '\n' },

                // Customer Info
                {
                    columns: [
                        {
                            width: 'auto',
                            text: 'Cliente:', bold: true, fontSize: 10
                        },
                        {
                            width: '*',
                            text: data.customer.name, fontSize: 10, margin: [5, 0, 0, 0]
                        },
                        {
                            width: 'auto',
                            text: 'RUC/Cédula:', bold: true, fontSize: 10
                        },
                        {
                            width: 100,
                            text: data.customer.ruc || 'N/A', fontSize: 10, alignment: 'right'
                        }
                    ]
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
                                { text: 'ITBMS', style: 'tableHeader', alignment: 'right', fontSize: 8 },
                                { text: 'Total', style: 'tableHeader', alignment: 'right' }
                            ],
                            ...data.items.map(item => [
                                { text: item.quantity, fontSize: 9 },
                                { text: item.description, fontSize: 9 },
                                { text: Number(item.price).toFixed(2), alignment: 'right', fontSize: 9 },
                                { text: item.taxRate > 0 ? `${(item.taxRate * 100).toFixed(0)}%` : 'Exento', alignment: 'right', fontSize: 8 },
                                { text: Number(item.total).toFixed(2), alignment: 'right', fontSize: 9 }
                            ])
                        ]
                    },
                    layout: 'lightHorizontalLines'
                },
                { text: '\n' },

                // Totals
                {
                    columns: [
                        { width: '*', text: '' },
                        {
                            width: 200,
                            table: {
                                widths: ['*', 'auto'],
                                body: [
                                    [{ text: 'Subtotal:', bold: true, alignment: 'right' }, { text: Number(data.totals.subtotal).toFixed(2), alignment: 'right' }],
                                    [{ text: 'ITBMS:', bold: true, alignment: 'right' }, { text: Number(data.totals.tax).toFixed(2), alignment: 'right' }],
                                    [{ text: 'TOTAL:', bold: true, alignment: 'right', fontSize: 12 }, { text: Number(data.totals.total).toFixed(2), alignment: 'right', fontSize: 12, bold: true }]
                                ]
                            },
                            layout: 'noBorders'
                        }
                    ]
                },
                { text: '\n\n' },

                // QR Code & CUFE
                {
                    columns: [
                        {
                            width: 100,
                            image: qrBuffer,
                            fit: [100, 100]
                        },
                        {
                            width: '*',
                            margin: [10, 0, 0, 0],
                            stack: [
                                { text: 'Consulte su factura escaneando el código QR o ingresando el CUFE en el portal de la DGI.', fontSize: 8, color: 'gray' },
                                { text: '\nCUFE:', bold: true, fontSize: 8 },
                                { text: data.cufe || 'PENDIENTE DE AUTORIZACIÓN', fontSize: 8, font: 'Courier' },
                                { text: '\nResolución No. 201-XXXX', fontSize: 8 }
                            ]
                        }
                    ]
                }
            ],
            footer: (currentPage, pageCount) => {
                return { text: `Página ${currentPage} de ${pageCount}`, alignment: 'center', fontSize: 8, margin: [0, 10] };
            },
            styles: {
                headerIssuer: { fontSize: 14, bold: true },
                subHeaderIssuer: { fontSize: 10, bold: true, margin: [0, 5, 0, 5] },
                docTitle: { fontSize: 12, bold: true },
                docNumber: { fontSize: 12, color: 'red', bold: true },
                small: { fontSize: 8 },
                tableHeader: { bold: true, fontSize: 9, color: 'black', fillColor: '#eeeeee' }
            },
            defaultStyle: {
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
