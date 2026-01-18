const PdfPrinter = require('pdfmake');
const path = require('path');
const fs = require('fs');

const fonts = {
    Helvetica: {
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

/**
 * Generates a Delivery Note PDF.
 * @param {Object} note Delivery Note data
 * @param {Object} company Company data
 * @returns {Promise<Buffer>} PDF Buffer
 */
const generateDeliveryNotePdf = async (note, company) => {
    return new Promise((resolve, reject) => {
        try {
            // Defensive data mapping
            const safeCompany = {
                name: (company?.name || 'EMPRESA').toUpperCase(),
                taxId: company?.taxId || '',
                dv: company?.dv || '',
                address: company?.getFullAddress ? company.getFullAddress() : (company?.addressLine1 || ''),
                phone: company?.phone || '',
                email: company?.email || '',
                logo: company?.documentLogo || null
            };

            const safeNote = {
                number: note?.number || 'N/A',
                date: note?.date || '',
                customerName: note?.customer?.name || 'N/A',
                customerTaxId: note?.customer?.taxId || 'N/A',
                items: (note?.items || []).map(item => ({
                    description: item?.description || '',
                    quantity: Number(item?.quantity || 0).toFixed(0)
                })),
                notes: note?.notes || ''
            };

            const content = [];

            // Header Section
            const headerColumns = [];

            // Logo column
            let logoImage = null;
            if (safeCompany.logo) {
                const logoPath = path.join(__dirname, '../../', safeCompany.logo);
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
                    { text: safeCompany.name, style: 'header' },
                    { text: `RUC: ${safeCompany.taxId}  DV: ${safeCompany.dv}`, style: 'subHeader' },
                    { text: safeCompany.address, style: 'subHeader' },
                    { text: `Tel: ${safeCompany.phone} | Email: ${safeCompany.email}`, style: 'subHeader' }
                ]
            });

            // Document info column
            headerColumns.push({
                width: 150,
                stack: [
                    { text: 'NOTA DE ENTREGA', style: 'docTitle', alignment: 'right' },
                    { text: `Número: ${safeNote.number}`, style: 'docSubtitle', alignment: 'right' },
                    { text: `Fecha: ${safeNote.date}`, style: 'docSubtitle', alignment: 'right' }
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
                                { text: `Cliente: ${safeNote.customerName}`, style: 'infoLine' },
                                { text: `RUC/Cédula: ${safeNote.customerTaxId}`, style: 'infoLine' }
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
                        ...safeNote.items.map(item => [
                            { text: item.description, style: 'tableCell' },
                            { text: item.quantity, style: 'tableCell', alignment: 'center' }
                        ])
                    ]
                },
                layout: 'lightHorizontalLines'
            });

            if (safeNote.notes) {
                content.push({ text: '\n' });
                content.push({ text: 'Notas:', style: 'label' });
                content.push({ text: safeNote.notes, style: 'small' });
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
                    font: 'Helvetica',
                    fontSize: 10
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
