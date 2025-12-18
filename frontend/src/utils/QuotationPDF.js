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

export const generateQuotationPDF = async (quotation, company = {}) => {
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
        safeText(`${company.name || 'CBTECH SOLUTIONS'}`, pageWidth - 15, 15, { align: 'right' });
        safeText(`RUC: ${company.taxId || ''} DV: ${company.dv || ''}`, pageWidth - 15, 20, { align: 'right' });
        safeText(company.address || 'Panamá, Ciudad de Panamá', pageWidth - 15, 25, { align: 'right' });
        safeText(company.email || 'info@cbtech.com', pageWidth - 15, 30, { align: 'right' });
        const phoneText = company.phone ? `Tel: ${company.phone}` : '';
        safeText(phoneText, pageWidth - 15, 35, { align: 'right' });

        // Title
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('COTIZACIÓN', 15, 45);

        // Quotation Details
        doc.setFontSize(10);
        doc.setTextColor(80);

        // Helper to formatting date without timezone shift
        const formatDate = (dateString) => {
            if (!dateString) return new Date().toLocaleDateString();
            // Assuming dateString is "YYYY-MM-DD" or similar ISO date part
            const date = new Date(dateString);
            return new Date(date.valueOf() + date.getTimezoneOffset() * 60 * 1000).toLocaleDateString();
        };

        const detailsY = 55;
        doc.text(`Número: ${quotation.number || '---'}`, 15, detailsY);
        doc.text(`Fecha: ${formatDate(quotation.date)}`, 15, detailsY + 5);
        if (quotation.validUntil) {
            doc.text(`Válida hasta: ${formatDate(quotation.validUntil)}`, 15, detailsY + 10);
        }

        // Customer Details (Right side, below company info)
        doc.text(`Cliente:`, pageWidth - 80, detailsY);
        doc.setFont(undefined, 'bold');
        const clientName = quotation.customer?.name || (quotation.Customer ? quotation.Customer.name : 'Cliente');
        safeText(clientName, pageWidth - 80, detailsY + 5);
        doc.setFont(undefined, 'normal');

        // --- Items Table ---
        const tableColumn = ["Descripción", "Cant.", "Precio", "Desc.", "Total"];
        const tableRows = [];

        if (quotation.items && Array.isArray(quotation.items)) {
            quotation.items.forEach(item => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;

                // Calculate discrete discount for display
                let discountAmt = 0;
                if (item.discountType === 'percentage') {
                    discountAmt = (qty * price) * (parseFloat(item.discountValue) / 100);
                } else {
                    discountAmt = parseFloat(item.discountValue) || 0;
                }

                let description = item.description || '';
                if (item.productCode || item.productName) {
                    const parts = [];
                    if (item.productCode) parts.push(item.productCode);
                    if (item.productName) parts.push(item.productName);
                    const productLabel = parts.join(' - ');

                    // Avoid duplicating if description is identical or empty
                    if (productLabel && description !== productLabel) {
                        // Combine them: Product Label \n Description
                        // If description is empty, just Label.
                        if (description) {
                            description = `${productLabel}\n${description}`;
                        } else {
                            description = productLabel;
                        }
                    } else if (!description) {
                        description = productLabel;
                    }
                }

                const itemData = [
                    String(description),
                    String(qty),
                    `$${price.toFixed(2)}`,
                    `$${discountAmt.toFixed(2)}`,
                    `$${(parseFloat(item.total) || 0).toFixed(2)}`
                ];
                tableRows.push(itemData);
            });
        }

        try {
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 85,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
                styles: { fontSize: 9 },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 15, halign: 'center' },
                    2: { cellWidth: 25, halign: 'right' },
                    3: { cellWidth: 25, halign: 'right' },
                    4: { cellWidth: 25, halign: 'right' }
                }
            });
        } catch (tableError) {
            console.error('Error generating table:', tableError);
            doc.text('Error al generar tabla de items', 15, 85);
        }

        // --- Footer / Totals ---
        // Safety check for finalY
        let finalY = 150;
        if (doc.lastAutoTable && doc.lastAutoTable.finalY) {
            finalY = doc.lastAutoTable.finalY + 10;
        } else {
            // Fallback estimation if table failed or didn't run
            finalY = 85 + (tableRows.length * 10) + 20;
        }

        // Create breakdown calculation
        let grossItemsTotal = 0;
        let totalItemDiscounts = 0;

        if (quotation.items && Array.isArray(quotation.items)) {
            quotation.items.forEach(item => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;
                const itemGross = qty * price;
                let itemDiscount = 0;
                if (item.discountType === 'percentage') {
                    itemDiscount = itemGross * (parseFloat(item.discountValue || 0) / 100);
                } else {
                    itemDiscount = parseFloat(item.discountValue || 0);
                }
                grossItemsTotal += itemGross;
                totalItemDiscounts += itemDiscount;
            });
        }

        const netItemsTotal = grossItemsTotal - totalItemDiscounts;

        // Calculate Global Discount
        let globalDiscountAmt = 0;
        if (quotation.discountType === 'percentage') {
            globalDiscountAmt = netItemsTotal * (parseFloat(quotation.discountValue || 0) / 100);
        } else {
            globalDiscountAmt = parseFloat(quotation.discountValue || 0);
        }

        // Total Discount to show (Item Discounts + Global)
        const totalDiscountApplied = totalItemDiscounts + globalDiscountAmt;

        const totalsX = pageWidth - 70;

        // Use the calculated Gross Total for display
        doc.setFontSize(10);
        doc.setTextColor(80);

        // 1. Subtotal Bruto
        doc.text('Subtotal Bruto:', totalsX, finalY);
        doc.text(`$${grossItemsTotal.toFixed(2)}`, pageWidth - 15, finalY, { align: 'right' });

        let currentY = finalY;

        // 2. Descuentos por Línea (Solo si hay)
        if (totalItemDiscounts > 0) {
            currentY += 6;
            doc.text('Descuentos por Línea:', totalsX, currentY);
            doc.text(`- $${totalItemDiscounts.toFixed(2)}`, pageWidth - 15, currentY, { align: 'right' });
        }

        // 3. Descuento Global Comercial (Solo si hay)
        if (globalDiscountAmt > 0) {
            currentY += 6;
            doc.text('Descuento Global Comercial:', totalsX, currentY);
            doc.text(`- $${globalDiscountAmt.toFixed(2)}`, pageWidth - 15, currentY, { align: 'right' });
        }

        // 4. Total de Ahorro Cliente (Green/Bold)
        if (totalDiscountApplied > 0) {
            currentY += 6;
            doc.setTextColor(22, 163, 74); // Green-600
            doc.setFont(undefined, 'bold');
            doc.text('Total de Ahorro Cliente:', totalsX, currentY);
            doc.text(`$${totalDiscountApplied.toFixed(2)}`, pageWidth - 15, currentY, { align: 'right' });

            // Reset styles
            doc.setTextColor(80);
            doc.setFont(undefined, 'normal');
        }

        // 5. Subtotal Neto (Base Imponible)
        currentY += 6;
        doc.text('Subtotal Neto (Base Imponible):', totalsX, currentY);
        const taxable = Math.max(0, netItemsTotal - globalDiscountAmt);
        // Note: netItemsTotal = Gross - ItemDisc. So Taxable = Gross - ItemDisc - GlobalDisc
        doc.text(`$${taxable.toFixed(2)}`, pageWidth - 15, currentY, { align: 'right' });

        // 6. Impuestos
        currentY += 6;
        doc.text(`Impuestos (${quotation.taxRate !== undefined ? quotation.taxRate : 7}%):`, totalsX, currentY);
        doc.text(`$${(parseFloat(quotation.tax) || 0).toFixed(2)}`, pageWidth - 15, currentY, { align: 'right' });

        // 7. TOTAL A PAGAR
        currentY += 8;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('TOTAL A PAGAR:', totalsX, currentY);
        doc.text(`$${(parseFloat(quotation.total) || 0).toFixed(2)}`, pageWidth - 15, currentY, { align: 'right' });

        // Notes (Left aligned)
        if (quotation.notes) {
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.text('Notas:', 15, finalY);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);

            // Safe split
            try {
                const safeNotes = String(quotation.notes);
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
        if (quotation && quotation.number) {
            safeNumber = String(quotation.number).replace(/[^a-zA-Z0-9_\-.]/g, '_');
        }
        const filename = `cotizacion-${safeNumber}.pdf`;

        console.log('Saving PDF with filename:', filename);

        // Manual save with ArrayBuffer and explicit Blob type
        const pdfOutput = doc.output('arraybuffer');
        const blob = new Blob([pdfOutput], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        // Extended cleanup time to ensure download starts
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 2000);

        return true;
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error; // Rethrow to let component handle alert
    }
};
