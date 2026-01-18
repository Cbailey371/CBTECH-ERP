const PdfPrinter = require('pdfmake');
const path = require('path');
const fs = require('fs');

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-regular.woff'),
        bold: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-medium.woff'),
        italics: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-italic.woff'),
        bolditalics: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-mediumitalic.woff')
    }
};

const printer = new PdfPrinter(fonts);

/**
 * Generates a Delivery Note PDF.
 * @param {Object} note Delivery Note data
 * @param {Object} company Company data
 * @returns {Promise<Buffer>} PDF Buffer
 */
const generateDeliveryNotePdf = async (note, company) => {
    return new Promise((resolve, reject) => {
        try {
            const content = [];

            // Header Section
            const headerColumns = [];

            // Logo column
            let logoImage = null;
            if (company.documentLogo) {
                const logoPath = path.join(__dirname, '../../', company.documentLogo);
                if (fs.existsSync(logoPath)) {
                    logoImage = {
                        image: logoPath,
                        width: 100,
                        margin: [0, 0, 0, 10]
                    };
                }
            }

            if (logoImage) {
                headerColumns.push({
                    width: 120,
                    stack: [logoImage]
                });
            }

            // Company info column
            headerColumns.push({
                width: '*',
                stack: [
                    { text: (company.name || 'EMPRESA').toUpperCase(), style: 'header' },
                    { text: `RUC: ${company.taxId || ''}  DV: ${company.dv || ''}`, style: 'subHeader' },
                    { text: company.getFullAddress ? company.getFullAddress() : (company.addressLine1 || ''), style: 'subHeader' },
                    { text: `Tel: ${company.phone || ''} | Email: ${company.email || ''}`, style: 'subHeader' }
                ]
            });

            // Document info column
            headerColumns.push({
                width: 150,
                stack: [
                    { text: 'NOTA DE ENTREGA', style: 'docTitle', alignment: 'right' },
                    { text: `Número: ${note.number}`, style: 'docSubtitle', alignment: 'right' },
                    { text: `Fecha: ${note.date}`, style: 'docSubtitle', alignment: 'right' }
                ]
            });

            content.push({ columns: headerColumns });
            content.push({ canvas: [{ type: 'line', x1: 0, y1: 10, x2: 515, y2: 10, lineWidth: 1, lineColor: '#eeeeee' }] });
            content.push({ text: '\n' });

            // Customer Section
            content.push({
                table: {
                    widths: ['*'],
                    body: [
                        [{ text: 'DATOS DEL CLIENTE', style: 'sectionHeader', fillColor: '#f9f9f9' }],
                        [{
                            stack: [
                                { text: `Cliente: ${note.customer?.name || 'N/A'}`, style: 'infoLine' },
                                { text: `RUC/Cédula: ${note.customer?.taxId || 'N/A'}`, style: 'infoLine' }
                            ],
                            margin: [5, 5, 5, 5]
                        }]
                    ]
                },
                layout: 'lightHorizontalLines'
            });
            content.push({ text: '\n' });

            // Items Table
            content.push({
                table: {
                    headerRows: 1,
                    widths: ['*', 60],
                    body: [
                        [
                            { text: 'DESCRIPCIÓN', style: 'tableHeader', fillColor: '#eeeeee' },
                            { text: 'CANT.', style: 'tableHeader', fillColor: '#eeeeee', alignment: 'center' }
                        ],
                        ...note.items.map(item => [
                            { text: item.description, style: 'tableCell' },
                            { text: Number(item.quantity).toFixed(0), style: 'tableCell', alignment: 'center' }
                        ])
                    ]
                },
                layout: 'lightHorizontalLines'
            });

            if (note.notes) {
                content.push({ text: '\n' });
                content.push({ text: 'Notas:', style: 'label' });
                content.push({ text: note.notes, style: 'small' });
            }

            content.push({ text: '\n\n\n\n' });

            // Signature Section
            content.push({
                columns: [
                    {
                        width: '*',
                        stack: [
                            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] },
                            { text: 'Recibido por', style: 'infoLine', margin: [0, 5, 0, 0] }
                        ]
                    },
                    {
                        width: '*',
                        stack: [
                            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 150, y2: 0, lineWidth: 1 }] },
                            { text: 'Fecha', style: 'infoLine', margin: [0, 5, 0, 0] }
                        ],
                        alignment: 'right'
                    }
                ],
                margin: [40, 0, 40, 0]
            });

            const docDefinition = {
                pageSize: 'LETTER',
                pageMargins: [40, 40, 40, 40],
                content: content,
                styles: {
                    header: { fontSize: 14, bold: true, margin: [0, 0, 0, 2] },
                    subHeader: { fontSize: 9, color: '#666666' },
                    docTitle: { fontSize: 16, bold: true, color: '#333333' },
                    docSubtitle: { fontSize: 11, bold: true, margin: [0, 2, 0, 2] },
                    sectionHeader: { fontSize: 10, bold: true, margin: [0, 2, 0, 2] },
                    infoLine: { fontSize: 10, margin: [0, 2, 0, 2] },
                    tableHeader: { bold: true, fontSize: 10, margin: [0, 5, 0, 5] },
                    tableCell: { fontSize: 10, margin: [0, 5, 0, 5] },
                    label: { bold: true, fontSize: 10 },
                    small: { fontSize: 8, color: '#666666' }
                },
                defaultStyle: {
                    font: 'Roboto'
                }
            };

            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.on('error', err => reject(err));
            pdfDoc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateDeliveryNotePdf };
