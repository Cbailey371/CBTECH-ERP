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

export const generatePurchaseOrderPDF = async (po, company = {}) => {
    try {
        const doc = new jsPDF();
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

        // Helper for safe text
        const safeText = (text, x, y, options) => {
            const str = text !== null && text !== undefined ? String(text) : '';
            doc.text(str, x, y, options);
        };

        // Company Info (Right aligned)
        doc.setFontSize(10);
        doc.setTextColor(100);
        safeText(company.name || 'CBTECH SOLUTIONS', pageWidth - 15, 15, { align: 'right' });
        safeText(`RUC: ${company.taxId || ''}`, pageWidth - 15, 20, { align: 'right' });
        safeText(company.address || 'Panamá, Ciudad de Panamá', pageWidth - 15, 25, { align: 'right' });
        safeText(company.email || 'info@cbtech.com', pageWidth - 15, 30, { align: 'right' });
        const phoneText = company.phone ? `Tel: ${company.phone}` : '';
        safeText(phoneText, pageWidth - 15, 35, { align: 'right' });

        // Title
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('ORDEN DE COMPRA', 15, 45);

        // PO Details
        doc.setFontSize(10);
        doc.setTextColor(80);

        const detailsY = 55;
        doc.text(`Número: ${po.orderNumber || po.code || '---'}`, 15, detailsY);
        doc.text(`Fecha Emisión: ${po.issueDate ? new Date(po.issueDate).toLocaleDateString() : '---'}`, 15, detailsY + 5);

        if (po.deliveryDate) {
            doc.text(`Fecha Entrega: ${new Date(po.deliveryDate).toLocaleDateString()}`, 15, detailsY + 10);
        }

        if (po.paymentTerms) {
            doc.text(`Términos Pago: ${po.paymentTerms}`, 15, detailsY + 15);
        }

        // Supplier Details (Right side, below company info)
        doc.text(`Proveedor:`, pageWidth - 80, detailsY);
        doc.setFont(undefined, 'bold');
        const supplierName = po.supplier?.name || (po.Supplier ? po.Supplier.name : (po.supplierId ? `ID: ${po.supplierId}` : 'Proveedor'));
        safeText(supplierName, pageWidth - 80, detailsY + 5);
        doc.setFont(undefined, 'normal');

        // --- Items Table ---
        const tableColumn = ["Producto", "Cant.", "Costo Unit.", "Impuesto", "Subtotal"];
        const tableRows = [];

        if (po.items && Array.isArray(po.items)) {
            po.items.forEach(item => {
                const qty = parseFloat(item.quantity) || 0;
                const cost = parseFloat(item.unitPrice) || 0;
                const taxRate = parseFloat(item.taxRate) || 0;
                const subtotal = qty * cost;
                // Tax isn't a column usually, but subtotal is usually pre-tax standard, 
                // formatted string with tax % helps

                const itemData = [
                    String(item.description || (item.product?.name || 'Item')),
                    String(qty),
                    `$${cost.toFixed(2)}`,
                    `${(taxRate * 100).toFixed(0)}%`,
                    `$${subtotal.toFixed(2)}`
                ];
                tableRows.push(itemData);
            });
        }

        try {
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 90,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
                styles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 20, halign: 'center' },
                    4: { cellWidth: 30, halign: 'right' }
                }
            });
        } catch (tableError) {
            console.error('Error generating table:', tableError);
            doc.text('Error al generar tabla de items', 15, 90);
        }

        // --- Footer / Totals ---
        let finalY = 150;
        if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
            finalY = doc.lastAutoTable.finalY + 10;
        } else {
            finalY = 90 + (tableRows.length * 10) + 20;
        }

        const totalsX = pageWidth - 70;

        // Calculate totals if they aren't provided in the PO object?
        // PurchaseOrderForm maintains 'totals' state, but PO object from DB has columns subtotal, taxTotal, total.
        const subtotal = parseFloat(po.subtotal) || 0; // Use object values if available
        const taxTotal = parseFloat(po.taxTotal) || 0;
        const total = parseFloat(po.total) || 0;

        // If database values are 0 (e.g. unsaved draft in memory), recalculate? 
        // For now relying on passed object, assuming it's synced.

        doc.setFontSize(10);
        doc.text('Subtotal:', totalsX, finalY);
        doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 15, finalY, { align: 'right' });

        doc.text('Impuestos:', totalsX, finalY + 6);
        doc.text(`$${taxTotal.toFixed(2)}`, pageWidth - 15, finalY + 6, { align: 'right' });

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Total:', totalsX, finalY + 14);
        doc.text(`$${total.toFixed(2)}`, pageWidth - 15, finalY + 14, { align: 'right' });

        // Notes
        if (po.notes) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Notas:', 15, finalY);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);

            try {
                const safeNotes = String(po.notes);
                const splitNotes = doc.splitTextToSize(safeNotes, 100);
                doc.text(splitNotes, 15, finalY + 5);
            } catch (noteError) {
                console.warn('Error rendering notes', noteError);
            }
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generado por CBTECH-ERP', 15, doc.internal.pageSize.height - 10);

        // Sanitize filename
        let safeNumber = 'borrador';
        const rawNum = po.orderNumber || po.code;
        if (rawNum) {
            safeNumber = String(rawNum).replace(/[^a-zA-Z0-9_\-.]/g, '_');
        }
        const filename = `orden-compra-${safeNumber}.pdf`;

        // Manual save
        const pdfOutput = doc.output('arraybuffer');
        const blob = new Blob([pdfOutput], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 2000);

        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};
