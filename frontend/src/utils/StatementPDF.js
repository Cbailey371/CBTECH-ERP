import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/imprimiblelogo.jpg';

// Helper to load image
const loadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
    });
};

export const generateStatementPDF = async (data, company) => {
    const doc = new jsPDF();
    // autoTable(doc, options) pattern or doc.autoTable if correctly hooked?
    // v3.5+ explicit usage:
    // autoTable(doc, { ... }) is supported but legacy doc.autoTable requires side-effect import.
    // Let's stick to standard v3 import which often doesn't hook prototype automatically in Vite.

    // Actually, best current practice for Vite:
    // import autoTable from 'jspdf-autotable'
    // autoTable(doc, { ... }) OR doc is modified if side-effect works.
    // Let's try explicit implementation matching the library signature.

    const { customer, aging, invoices } = data;
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---

    // Logo
    try {
        if (typeof logo === 'string') {
            const img = await loadImage(logo);
            doc.addImage(img, 'JPEG', 15, 10, 40, 15, undefined, 'FAST');
        }
    } catch (e) {
        console.warn('Could not add logo', e);
    }

    // Company Info (Right aligned)
    doc.setFontSize(10);
    doc.setTextColor(100);
    const safeText = (text, x, y, options) => {
        const str = text !== null && text !== undefined ? String(text) : '';
        doc.text(str, x, y, options);
    };

    safeText(company.name || 'Empresa', pageWidth - 15, 15, { align: 'right' });
    safeText(`RUC: ${company.taxId || ''} DV: ${company.dv || ''}`, pageWidth - 15, 20, { align: 'right' });
    safeText(company.address || 'Panamá', pageWidth - 15, 25, { align: 'right' });
    safeText(company.email || '', pageWidth - 15, 30, { align: 'right' });
    if (company.phone) {
        safeText(`Tel: ${company.phone}`, pageWidth - 15, 35, { align: 'right' });
    }

    // Title
    doc.setFontSize(22);
    doc.setTextColor(0, 0, 0); // Black
    doc.text('Estado de Cuenta', 15, 45);

    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 15, 52);

    // Customer Info
    doc.setFontSize(14);
    doc.text('Cliente:', 15, 65);
    doc.setFontSize(10);
    doc.text(`${customer.name}`, 15, 71);
    doc.text(`RUC: ${customer.ruc || 'N/A'}`, 15, 77);

    // Aging Summary Box
    const startY = 85;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, startY, 180, 25, 'F');

    doc.setFontSize(10);
    doc.text('Resumen de Antigüedad', 16, startY + 6);

    const headers = ['Total Vencido', '0-30 Días', '31-60 Días', '61-90 Días', '90+ Días'];
    const values = [
        aging.totalDue.toFixed(2),
        aging.range0_30.toFixed(2),
        aging.range31_60.toFixed(2),
        aging.range61_90.toFixed(2),
        aging.range90plus.toFixed(2)
    ];

    let x = 16;
    headers.forEach((h, i) => {
        doc.setFontSize(8);
        doc.text(h, x, startY + 14);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${values[i]}`, x, startY + 20);
        x += 35;
    });

    // Invoices Table
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
        startY: startY + 30,
        head: [['Factura', 'Fecha', 'Antigüedad', 'Total', 'Pagado', 'Saldo']],
        body: invoices.map(inv => [
            inv.number,
            new Date(inv.date).toLocaleDateString(),
            `${inv.ageDays} días`,
            `$${inv.total.toFixed(2)}`,
            `$${inv.paid.toFixed(2)}`,
            `$${inv.balance.toFixed(2)}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 9 },
        columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });

    // Save
    doc.save(`EstadoCuenta_${customer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};
