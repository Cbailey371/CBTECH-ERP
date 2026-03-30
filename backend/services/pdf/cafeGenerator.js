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

const formatIssueDateStr = (dateStr) => {
    try {
        if (!dateStr) return { date: 'N/A', time: 'N/A' };
        
        if (dateStr.includes(' de ')) {
             const parts = dateStr.split(' ');
             if (parts.length >= 6) {
                  return {
                      date: parts.slice(0, 5).join(' '),
                      time: parts[5] || ''
                  };
             }
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return { date: dateStr, time: '' };
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const timeStr = d.toTimeString().split(' ')[0];
        return {
            date: `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`,
            time: timeStr
        };
    } catch(e) {
         return { date: dateStr || 'N/A', time: '' };
    }
};

const blueColor = '#0066cc';

const blueLayoutDashedInner = {
    hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1.5 : 1; },
    vLineWidth: function (i, node) { return (i === 0 || i === node.table.widths.length) ? 1.5 : 1; },
    hLineColor: function () { return blueColor; },
    vLineColor: function () { return blueColor; },
    hLineStyle: function (i, node) { return (i === 0 || i === node.table.body.length) ? null : {dash: {length: 2, space: 2}}; },
    vLineStyle: function (i, node) { return (i === 0 || i === node.table.widths.length) ? null : {dash: {length: 2, space: 2}}; },
    paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3
};

const itemsLayout = {
    hLineWidth: function (i, node) { 
        if (i === 0 || i === node.table.body.length) return 1.5; 
        if (i === 1) return 1.5; 
        return 1; 
    },
    vLineWidth: function (i, node) { return (i === 0 || i === node.table.widths.length) ? 1.5 : 1; },
    hLineColor: function () { return blueColor; },
    vLineColor: function () { return blueColor; },
    hLineStyle: function (i, node) { 
        if (i === 0 || i === 1 || i === node.table.body.length) return null; 
        return {dash: {length: 2, space: 2}}; 
    },
    vLineStyle: function (i, node) { 
        if (i === 0 || i === node.table.widths.length) return null; 
        return {dash: {length: 2, space: 2}}; 
    },
    paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 3, paddingBottom: () => 3
};

const validationBoxLayout = {
    hLineWidth: () => 1.5,
    vLineWidth: () => 1.5,
    hLineColor: () => blueColor,
    vLineColor: () => blueColor,
    paddingLeft: () => 8, paddingRight: () => 8, paddingTop: () => 6, paddingBottom: () => 6
};

const generateCafePdf = async (data) => {
    try {
        const qrBuffer = await QRCode.toDataURL(data.qrUrl || 'NO_QR', { 
            errorCorrectionLevel: 'H',
            margin: 1,
            scale: 6
        });
        
        const logoContent = data.logo || null;
        const logoOrEmpty = logoContent 
            ? { image: logoContent, width: 120, alignment: 'center', margin: [0, 20, 0, 0] } 
            : { text: '', width: 120 };

        const isNC = data.docType === '03' || data.docType === '04';
        const docTitle = isNC ? 'NOTA DE CRÉDITO ELECTRÓNICA' : 'FACTURA ELECTRÓNICA';
        const opType = isNC 
            ? 'Nota de crédito' 
            : (data.isExtranjero ? 'Factura de Operación Extranjera' : 'Factura de Operación Interna');

        const { date: iDate, time: iTime } = formatIssueDateStr(data.issueDate);
        
        let protocolStr = data.protocol && data.protocol !== 'null' && data.protocol !== 'AUTORIZADO' ? data.protocol : '00000000000-0-000000000000000000000';
        
        const docDefinition = {
            pageSize: 'LETTER',
            pageMargins: [30, 20, 30, 60],
            content: [
                { text: 'DGI\nCOMPROBANTE AUXILIAR DE FACTURA ELECTRÓNICA', alignment: 'center', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                
                // BOX 1: Emisor & Receptor
                {
                    table: {
                        widths: [150, '*'],
                        body: [
                            [
                                {
                                    ...logoOrEmpty,
                                    border: [false, false, true, false] 
                                },
                                {
                                    table: {
                                        widths: ['*'],
                                        body: [
                                            [{ text: [{text: 'Nombre Emisor: ', bold: true}, data.issuer.razonSocial || ''], margin: [0, 0] }],
                                            [{ text: [{text: 'Ruc Emisor: ', bold: true}, `${data.issuer.ruc || ''} `, {text: 'DV: ', bold: true}, data.issuer.dv || ''], margin: [0, 0] }],
                                            [{ text: [{text: 'Dirección Emisor: ', bold: true}, data.issuer.direccion || ''], margin: [0, 0] }],
                                            [{ text: [{text: 'Tipo de Receptor: ', bold: true}, data.customer.tipoReceptor || 'Contribuyente'], margin: [0, 0] }],
                                            [{ text: [{text: 'Razón Social: ', bold: true}, data.customer.name || ''], margin: [0, 0] }],
                                            [{ text: [{text: 'Ruc: ', bold: true}, `${data.customer.ruc || ''} `, {text: 'DV: ', bold: true}, data.customer.dv || ''], margin: [0, 0] }],
                                            [{ text: [{text: 'Dirección: ', bold: true}, data.customer.address || ''], margin: [0, 0] }]
                                        ]
                                    },
                                    layout: {
                                        hLineWidth: (i) => (i === 3) ? 1.5 : 0, 
                                        vLineWidth: () => 0,
                                        hLineColor: () => blueColor,
                                        paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 4, paddingBottom: () => 4
                                    },
                                    border: [false, false, false, false]
                                }
                            ]
                        ]
                    },
                    layout: {
                        hLineWidth: function (i, node) { return (i === 0 || i === node.table.body.length) ? 1.5 : 0; },
                        vLineWidth: function (i, node) { return (i === 0 || i === node.table.widths.length) ? 1.5 : 1.5; },
                        hLineColor: function () { return blueColor; },
                        vLineColor: function () { return blueColor; },
                        paddingLeft: () => 4, paddingRight: () => 4, paddingTop: () => 4, paddingBottom: () => 4
                    }
                },
                { text: '\n', fontSize: 6 },

                // BOX 2: Auth Info
                {
                    table: {
                        widths: [150, 110, '*'],
                        body: [
                            [
                                { text: [{text: 'Tipo: ', bold: true}, opType] },
                                { text: [{text: 'Número: ', bold: true}, data.documentNumber || ''] },
                                { text: [
                                    {text: 'Autorización de Uso Previa, operación normal\n', bold: true},
                                    {text: 'Protocolo de Autorización : ', bold: true}, `${protocolStr}, de\n${iDate} ${iTime}`
                                ]}
                            ],
                            [
                                { text: [{text: 'Fecha: ', bold: true}, iDate] },
                                { text: [{text: 'Hora: ', bold: true}, iTime] },
                                { 
                                    rowSpan: 2, 
                                    text: [
                                        {text: 'Consulte por la clave de acceso en\n', bold: true},
                                        {text: 'https://dgi-fep.mef.gob.pa/Consultas/FacturasPorCUFE\n'},
                                        {text: data.cufe || 'PENDIENTE'}
                                    ]
                                }
                            ],
                            [
                                { text: [{text: 'Sucursal: ', bold: true}, data.issuer.sucursal || '0000'] },
                                { text: [{text: 'Caja/Pto Fact: ', bold: true}, data.issuer.puntoDeVenta || '001'] },
                                ''
                            ],
                            [
                                { colSpan: 3, text: [{text: 'Observaciones: ', bold: true}, data.observaciones || ''] },
                                '',
                                ''
                            ]
                        ]
                    },
                    layout: blueLayoutDashedInner
                },
                { text: '\n', fontSize: 6 },

                // BOX 3: Items
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 70, 60, 70],
                        body: [
                            [
                                { text: 'Código', bold: true, alignment: 'center' },
                                { text: 'Descripción', bold: true, alignment: 'center' },
                                { text: 'Cantidad', bold: true, alignment: 'center' },
                                { text: 'Unidad', bold: true, alignment: 'center' },
                                { text: 'Valor Unitario', bold: true, alignment: 'center' },
                                { text: '% Impuesto', bold: true, alignment: 'center' },
                                { text: 'Valor Total', bold: true, alignment: 'center' }
                            ],
                            ...data.items.map(item => [
                                { text: item.code || '047', alignment: 'center', fontSize: 8 },
                                { text: item.description, fontSize: 8 },
                                { text: Number(item.quantity).toFixed(4), alignment: 'center', fontSize: 8 },
                                { text: item.unit || 'und', alignment: 'center', fontSize: 8 },
                                { text: Number(item.price).toFixed(2), alignment: 'right', fontSize: 8 },
                                { text: (item.total - (item.quantity * item.price) + (item.discount || 0)).toFixed(2), alignment: 'right', fontSize: 8 },
                                { text: Number(item.total).toFixed(2), alignment: 'right', fontSize: 8 }
                            ])
                        ]
                    },
                    layout: itemsLayout
                },
                { text: `Cantidad Items: ${data.items.length}`, fontSize: 9, margin: [5, 4, 0, 10] },

                // BOX 4: Totals & QR & Desglose
                {
                    columns: [
                        {
                            width: 170,
                            table: {
                                widths: ['*', 'auto', 'auto'],
                                body: [
                                    [{ text: 'Desglose ITBMS', colSpan: 3, alignment: 'center', bold: true }, '', ''],
                                    [{ text: 'Monto Base', bold: true, alignment: 'center', fontSize: 8 }, { text: '%', bold: true, alignment: 'center', fontSize: 8 }, { text: 'Impuesto', bold: true, alignment: 'center', fontSize: 8 }],
                                    ...Object.keys(data.totals.breakdown || {}).map(rate => [
                                        { text: data.totals.breakdown[rate].taxable.toFixed(2), alignment: 'center', fontSize: 8 },
                                        { text: rate === '0.00' ? 'EXENTO' : `${(parseFloat(rate) * 100).toFixed(0)}%`, alignment: 'center', fontSize: 8 },
                                        { text: data.totals.breakdown[rate].tax.toFixed(2), alignment: 'center', fontSize: 8 }
                                    ]),
                                    [{ text: 'Total', bold: true, alignment: 'right', fontSize: 8, colSpan: 2 }, '', { text: data.totals.totalTax.toFixed(2), alignment: 'center', fontSize: 8 }]
                                ]
                            },
                            layout: blueLayoutDashedInner
                        },
                        {
                            width: '*',
                            stack: [
                                { image: qrBuffer, width: 90, alignment: 'center', margin: [0, 5] }
                            ]
                        },
                        {
                            width: 170,
                            stack: [
                                {
                                    table: {
                                        widths: ['*', 60],
                                        body: [
                                            [{ text: 'SubTotal', bold: true, fontSize: 8 }, { text: data.totals.totalTaxable.toFixed(2), alignment: 'center', fontSize: 8 }],
                                            [{ text: 'Monto Exento', bold: true, fontSize: 8 }, { text: (data.totals.breakdown['0.00']?.taxable || 0).toFixed(2), alignment: 'center', fontSize: 8 }],
                                            [{ text: 'Monto Gravado', bold: true, fontSize: 8 }, { text: (data.totals.totalTaxable - (data.totals.breakdown['0.00']?.taxable || 0)).toFixed(2), alignment: 'center', fontSize: 8 }],
                                            [{ text: 'Total Impuesto', bold: true, fontSize: 8 }, { text: data.totals.totalTax.toFixed(2), alignment: 'center', fontSize: 8 }],
                                            [{ text: 'Total Recibido', bold: true, fontSize: 8 }, { text: data.totals.totalAmount.toFixed(2), alignment: 'center', fontSize: 8 }],
                                            [{ text: 'Total', bold: true, fontSize: 8 }, { text: data.totals.totalAmount.toFixed(2), alignment: 'center', fontSize: 8 }]
                                        ]
                                    },
                                    layout: blueLayoutDashedInner,
                                    margin: [0, 0, 0, 5]
                                },
                                {
                                    table: {
                                        widths: ['*', 60],
                                        body: [
                                            [{ text: 'Forma Pago', colSpan: 2, alignment: 'center', bold: true }, ''],
                                            [{ text: 'Transf./Depósito a cta.\nBancaria', bold: true, fontSize: 8, alignment: 'center' }, { text: data.totals.totalAmount.toFixed(2), alignment: 'center', fontSize: 8, margin: [0,4,0,0] }]
                                        ]
                                    },
                                    layout: blueLayoutDashedInner
                                }
                            ]
                        }
                    ]
                },
                { text: '\n\n' },
                
                // BOX Validation
                {
                    table: {
                        widths: ['*'],
                        body: [
                            [{text: 'Documento validado por DIGIFACT SERVICIOS, S.A. con RUC: 155704849-2-2021 D.V. 32, es Proveedor Autorizado Calificado, RESOLUCIÓN: 201-4219, de 29/06/2022', margin: [2, 2], fontSize: 9}]
                        ]
                    },
                    layout: validationBoxLayout
                }
            ],
            footer: function(currentPage, pageCount) {
                return {
                    columns: [
                        { text: `EMISOR: ${data.issuer.razonSocial}`, alignment: 'left', fontSize: 7, margin: [30, 0, 0, 0] },
                        { 
                            text: `SERIE: ${data.documentNumber || ''}\nFOLIO: ${(data.cufe || 'PENDIENTE').substring(0, 10)}\n\nPágina ${currentPage} de ${pageCount}`, 
                            alignment: 'right', 
                            fontSize: 8,
                            margin: [0, -10, 30, 0]
                        }
                    ]
                };
            },
            defaultStyle: {
                font: 'Roboto',
                fontSize: 9
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
