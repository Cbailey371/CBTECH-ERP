const PdfPrinter = require('pdfmake');
const path = require('path');

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-regular.woff'),
        bold: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-medium.woff'),
        italics: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-italic.woff'),
        bolditalics: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-mediumitalic.woff')
    }
};

const printer = new PdfPrinter(fonts);

const generateInvoicePdf = async (order, company, issuerConfig = null) => {
    return new Promise(async (resolve, reject) => {
        try {
            const docDefinition = {
                pageSize: 'LETTER',
                pageMargins: [40, 40, 40, 40],
                content: [
                    // Header
                    {
                        columns: [
                            {
                                width: '*',
                                text: [
                                    { text: (company.name || 'EMPRESA DEMO').toUpperCase() + '\n', style: 'header' },
                                    { text: (issuerConfig?.address || company.address || 'Ciudad de Panamá') + '\n', style: 'subHeader' },
                                    { text: 'RUC: ' + (issuerConfig?.ruc || company.ruc || '000-000-000') + ' DV: ' + (issuerConfig?.dv || company.dv || '00') + '\n', style: 'subHeader' },
                                    { text: 'Tel: ' + (company.phone || '0000-0000') + '\n', style: 'subHeader' },
                                    { text: (company.email || 'info@empresa.com'), style: 'subHeader' }
                                ]
                            },
                            {
                                width: 150,
                                stack: [
                                    { text: 'FACTURA DE VENTA', style: 'docTitle', alignment: 'right' },
                                    { text: 'NO FISCAL', style: 'docSubtitle', alignment: 'right', color: 'red' },
                                    { text: '\n' },
                                    {
                                        table: {
                                            widths: ['auto', 'auto'],
                                            body: [
                                                [{ text: 'N° FACTURA:', style: 'label' }, { text: order.orderNumber, style: 'value', bold: true }],
                                                [{ text: 'FECHA:', style: 'label' }, { text: new Date(order.issueDate).toLocaleDateString(), style: 'value' }],
                                            ]
                                        },
                                        layout: 'noBorders',
                                        alignment: 'right'
                                    }
                                ]
                            }
                        ]
                    },
                    { text: '\n\n' },

                    // Customer
                    {
                        table: {
                            widths: ['*'],
                            body: [
                                [{ text: 'DATOS DEL CLIENTE', style: 'sectionHeader', fillColor: '#eeeeee' }],
                                [{
                                    columns: [
                                        {
                                            width: '*',
                                            text: [
                                                { text: 'Cliente: ', style: 'label' }, { text: (order.customer?.name || 'Consumidor Final') + '\n' },
                                                { text: 'RUC/Cédula: ', style: 'label' }, { text: (order.customer?.taxId || 'N/A') + '\n' },
                                                { text: 'Dirección: ', style: 'label' }, { text: (order.customer?.address || 'N/A') }
                                            ]
                                        }
                                    ]
                                }]
                            ]
                        },
                        layout: 'noBorders'
                    },
                    { text: '\n' },

                    // Items
                    {
                        table: {
                            headerRows: 1,
                            widths: ['*', 'auto', 'auto', 'auto', 'auto'],
                            body: [
                                [
                                    { text: 'DESCRIPCIÓN', style: 'tableHeader', fillColor: '#eeeeee' },
                                    { text: 'CANT', style: 'tableHeader', fillColor: '#eeeeee', alignment: 'center' },
                                    { text: 'PRECIO', style: 'tableHeader', fillColor: '#eeeeee', alignment: 'right' },
                                    { text: 'DESC.', style: 'tableHeader', fillColor: '#eeeeee', alignment: 'right' },
                                    { text: 'TOTAL', style: 'tableHeader', fillColor: '#eeeeee', alignment: 'right' }
                                ],
                                ...order.items.map(item => [
                                    item.description,
                                    { text: parseFloat(item.quantity).toFixed(2), alignment: 'center' },
                                    { text: parseFloat(item.unitPrice).toFixed(2), alignment: 'right' },
                                    { text: parseFloat(item.discount || 0).toFixed(2), alignment: 'right' },
                                    { text: parseFloat(item.subtotal).toFixed(2), alignment: 'right' }
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
                                        [{ text: 'SUBTOTAL:', alignment: 'right', bold: true }, { text: parseFloat(order.subtotal).toFixed(2), alignment: 'right' }],
                                        [{ text: 'IMPUESTOS:', alignment: 'right', bold: true }, { text: parseFloat(order.taxTotal).toFixed(2), alignment: 'right' }],
                                        [{ text: 'TOTAL:', alignment: 'right', bold: true, fontSize: 12 }, { text: parseFloat(order.total).toFixed(2), alignment: 'right', bold: true, fontSize: 12 }]
                                    ]
                                },
                                layout: 'noBorders'
                            }
                        ]
                    },
                    { text: '\n\n\n' },

                    // Disclaimer
                    {
                        text: 'ESTO NO ES UN COMPROBANTE FISCAL VALIDO.\nPara efectos fiscales, solicite su Factura Electrónica.',
                        alignment: 'center',
                        fontSize: 9,
                        color: '#555555',
                        italics: true
                    }
                ],
                styles: {
                    header: { fontSize: 16, bold: true, color: '#333333' },
                    subHeader: { fontSize: 9, color: '#555555' },
                    docTitle: { fontSize: 14, bold: true, color: '#333333' },
                    docSubtitle: { fontSize: 10, bold: true },
                    sectionHeader: { fontSize: 10, bold: true, margin: [0, 5, 0, 5] },
                    label: { bold: true, fontSize: 9 },
                    tableHeader: { bold: true, fontSize: 9, color: '#333333' },
                    value: { fontSize: 9 }
                }
            };

            const pdfDoc = printer.createPdfKitDocument(docDefinition);
            const chunks = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
            pdfDoc.end();

        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateInvoicePdf };
