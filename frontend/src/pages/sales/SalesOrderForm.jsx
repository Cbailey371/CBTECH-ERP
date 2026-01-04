import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import * as salesOrderService from '../../services/salesOrderService';
import * as customerService from '../../services/customerService';
import * as productService from '../../services/productService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Plus, Trash2, Save, ArrowLeft, Send, Printer, Calculator } from 'lucide-react';
import { Combobox } from '../../components/ui/Combobox';
import { Textarea } from '../../components/ui/Textarea';

import { generateInvoicePDF } from '../../utils/InvoicePDF';

// ... (existing imports)


export default function SalesOrderForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, selectedCompany } = useAuth();
    const [loading, setLoading] = useState(false);
    const [debugLog, setDebugLog] = useState([]); // DEBUG STATE
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        notes: '',
        discountType: 'amount',
        discountValue: 0,
        taxRate: 7,
        taxEnabled: true
    });

    const [totals, setTotals] = useState({
        subtotal: 0,
        discount: 0,
        taxable: 0,
        tax: 0,
        total: 0,
        lineDiscounts: 0,
        globalDiscount: 0,
        totalSavings: 0
    });

    const isEditMode = !!id;

    useEffect(() => {
        if (selectedCompany) {
            loadDependencies();
            if (isEditMode) loadOrder();
        }
    }, [selectedCompany, id]);

    const loadDependencies = async () => {
        if (!selectedCompany) return;
        setDebugLog(prev => [...prev, 'Starting loadDependencies for company: ' + selectedCompany.id]);
        try {
            console.log('Loading dependencies for company:', selectedCompany.id);
            // Limit reduced to 100 to be safe, though 1000 should work. Adding explicit error handling.
            const [custRes, prodRes] = await Promise.all([
                customerService.getCustomers(token, selectedCompany.id, { limit: 100 }),
                productService.getProducts(token, selectedCompany.id, { limit: 100 })
            ]);

            setDebugLog(prev => [...prev, 'CustRes Success: ' + custRes.success, 'Cust Count: ' + (custRes.customers?.length || 0)]);

            console.log('Customers Response:', custRes);
            if (custRes.success) {
                if (!custRes.customers || custRes.customers.length === 0) {
                    console.warn('Backend returned success but 0 customers.');
                    // ALERT for debugging if needed, but console.warn is better for now unless strictly requested to alert on empty.
                    // The user asked for the list to appear, so if it's empty, we might want to know why.
                }
                setCustomers(custRes.customers || []);
            } else {
                console.error('Customer service returned success: false', custRes);
                alert('Error al cargar clientes: La respuesta del servidor indicó fallo.');
            }

            if (prodRes.success) {
                const pData = prodRes.products || prodRes.data?.products || [];
                setProducts(pData);
            }
        } catch (error) {
            console.error('Error loading dependencies:', error);
            setDebugLog(prev => [...prev, 'ERROR: ' + error.message, 'Details: ' + JSON.stringify(error.response?.data || {})]);
            alert('Error crítico al cargar datos: ' + (error.message || 'Error desconocido'));
        }
    };

    const loadOrder = async () => {
        setLoading(true);
        console.log('Loading Order ID:', id);
        try {
            const response = await salesOrderService.getOrderById(token, selectedCompany.id, id);
            console.log('Load Order Response:', response);
            if (response.success) {
                const order = response.order;
                console.log('Order Data:', order);

                // Infer Global Tax Settings
                // Since backend doesn't store 'taxEnabled' or 'taxRate' explicitly on the Order model,
                // we infer it. If taxTotal > 0, tax was enabled.
                // We can try to approximate the rate or default to 7%.
                const hasTax = parseFloat(order.taxTotal) > 0;
                // If items have taxRate, pick the first one's rate; otherwise 7.
                let inferredRate = 7;
                if (order.items && order.items.length > 0) {
                    const firstTaxed = order.items.find(i => parseFloat(i.taxRate) > 0);
                    if (firstTaxed) inferredRate = parseFloat(firstTaxed.taxRate) * 100;
                }

                const newData = {
                    ...order,
                    customerId: String(order.customerId || ''),
                    date: order.issueDate,
                    discountType: order.discountType || 'amount', // Add this
                    discountValue: parseFloat(order.discountValue) || 0, // Add this
                    taxEnabled: hasTax, // Add this
                    taxRate: inferredRate, // Add this
                    items: order.items.map(i => {
                        // Infer Item Discount Input
                        // Backend only stores 'discount' (amount).
                        // We must set discountType/Value for the UI to match.
                        // We'll default to 'amount' and value = discount amount.
                        // (Lossy round-trip but functional)
                        return {
                            ...i,
                            productId: i.productId || '',
                            description: i.description,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            discountType: 'amount', // Defaulting to amount since specific type isn't stored per item
                            discountValue: parseFloat(i.discount) || 0,
                            total: i.total
                        };
                    })
                };
                console.log('Setting FormData:', newData);
                setFormData(newData);
            }
        } catch (error) {
            console.error('Error loading order:', error);
            alert('Error al cargar la factura: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateTotals();
    }, [formData.items, formData.discountType, formData.discountValue, formData.taxRate, formData.taxEnabled]);

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                productId: '',
                description: '',
                quantity: 1,
                unitPrice: 0,
                discountType: 'amount',
                discountValue: 0,
                total: 0
            }]
        }));
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Recalcular total visual de la línea
        const qty = parseFloat(newItems[index].quantity) || 0;
        const price = parseFloat(newItems[index].unitPrice) || 0;

        let discount = 0;
        if (newItems[index].discountType === 'percentage') {
            discount = (qty * price) * (parseFloat(newItems[index].discountValue || 0) / 100);
        } else {
            discount = parseFloat(newItems[index].discountValue || 0);
        }

        newItems[index].total = (qty * price) - discount;

        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleProductSelect = (index, productId) => {
        const product = products.find(p => p.id == productId);
        if (!product) return;

        const newItems = [...formData.items];
        newItems[index].productId = product.id;
        newItems[index].description = product.name || product.description || '';
        newItems[index].unitPrice = parseFloat(product.price) || 0;
        newItems[index].quantity = 1;
        newItems[index].discountType = 'amount';
        newItems[index].discountValue = 0;
        newItems[index].total = parseFloat(product.price) || 0;

        setFormData({ ...formData, items: newItems });
    };

    const calculateTotals = () => {
        let grossItemsTotal = 0;
        let totalItemDiscounts = 0;

        // 1. Calcular totales de línea y descuentos de línea
        formData.items.forEach(item => {
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

        // Net Items Total (Base for Global Discount)
        const netItemsTotal = grossItemsTotal - totalItemDiscounts;

        // 2. Calcular descuento global
        let globalDiscount = 0;
        if (formData.discountType === 'percentage') {
            globalDiscount = netItemsTotal * (parseFloat(formData.discountValue || 0) / 100);
        } else {
            globalDiscount = parseFloat(formData.discountValue || 0);
        }

        // 3. Totales Finales
        const totalDiscount = totalItemDiscounts + globalDiscount;
        const taxable = Math.max(0, netItemsTotal - globalDiscount);
        const effectiveTaxRate = formData.taxEnabled ? (parseFloat(formData.taxRate) / 100) : 0;
        const tax = taxable * effectiveTaxRate;
        const total = taxable + tax;

        setTotals({
            subtotal: grossItemsTotal,
            lineDiscounts: totalItemDiscounts,
            globalDiscount: globalDiscount,
            totalSavings: totalDiscount,
            taxable,
            tax,
            total
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerId) return alert('Seleccione un cliente');
        if (formData.items.length === 0) return alert('Agregue al menos un ítem');

        setLoading(true);
        try {
            // Prepare Items with explicit 'discount' (amount) and 'taxRate'
            const preparedItems = formData.items.map(item => {
                const qty = parseFloat(item.quantity) || 0;
                const price = parseFloat(item.unitPrice) || 0;

                // Calculate Discount Amount
                let discountAmt = 0;
                if (item.discountType === 'percentage') {
                    discountAmt = (qty * price) * (parseFloat(item.discountValue || 0) / 100);
                } else {
                    discountAmt = parseFloat(item.discountValue || 0);
                }

                // Determine Tax Rate
                // If global tax is enabled, use global rate. Else 0.
                const effectiveTaxRate = formData.taxEnabled ? (parseFloat(formData.taxRate) / 100) : 0;

                return {
                    productId: item.productId,
                    description: item.description,
                    quantity: qty,
                    unitPrice: price,
                    discount: discountAmt, // Sending calculation to backend
                    taxRate: effectiveTaxRate
                };
            });

            const payload = {
                customerId: formData.customerId,
                issueDate: formData.date,
                items: preparedItems,
                notes: formData.notes,
                discount: totals.globalDiscount, // Amount
                discountType: formData.discountType,
                discountValue: formData.discountValue,
                subtotal: totals.subtotal,
                taxTotal: totals.tax, // Note: backend expects taxTotal not tax
                total: totals.total
            };

            if (isEditMode) {
                alert("Edición no implementada en este demo.");
            } else {
                await salesOrderService.createOrder(token, selectedCompany.id, payload);
                alert('Factura creada exitosamente');
                navigate('/sales-orders');
            }
        } catch (error) {
            console.error(error);
            alert('Error al guardar');
        } finally {
            setLoading(false);
        }
    };

    const handleEmitFiscal = async () => {
        if (!confirm('¿Está seguro de emitir esta factura fiscalmente? Esta acción no se puede deshacer.')) return;
        setLoading(true);
        try {
            await salesOrderService.emitFiscalDocument(token, selectedCompany.id, id);
            alert('Factura emitida fiscalmente con éxito');
            loadOrder();
        } catch (error) {
            console.error(error);
            alert('Error al emitir factura fiscal: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        setLoading(true);
        try {
            const invoiceData = {
                ...formData,
                ...totals,
                number: formData.orderNumber || 'BORRADOR',
                customer: customers.find(c => String(c.id) === String(formData.customerId)),
                items: formData.items.map(item => {
                    // Loose equality for safety with IDs vs Strings
                    const product = products.find(p => p.id == item.productId);
                    return {
                        ...item,
                        productCode: product ? product.code : '',
                        productName: product ? product.name : ''
                    };
                })
            };

            await generateInvoicePDF(invoiceData, selectedCompany);

        } catch (error) {
            console.error(error);
            alert('Error al generar PDF: ' + (error.message || error));
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.customerId && isEditMode) return <div>Cargando...</div>;

    return (
        <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => navigate('/sales-orders')}>
                        <ArrowLeft className="w-5 h-5 mr-2" /> Volver
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEditMode ? `Factura ${formData.orderNumber || ''}` : 'Nueva Factura'}
                    </h1>
                </div>
                <div className="space-x-2">
                    {isEditMode && (
                        <Button variant="outline" onClick={handleDownloadPdf}>
                            <Printer className="w-4 h-4 mr-2" /> PDF No Fiscal
                        </Button>
                    )}
                    {isEditMode && formData.status === 'draft' && (
                        <Button
                            onClick={handleEmitFiscal}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Send className="w-4 h-4 mr-2" /> Emitir Fiscalmente
                        </Button>
                    )}
                    {!isEditMode && (
                        <Button onClick={handleSubmit} disabled={loading}>
                            <Save className="w-4 h-4 mr-2" /> Guardar Borrador
                        </Button>
                    )}
                </div>
            </div>

            <Card className="bg-card/50 border-border backdrop-blur-sm relative z-20">
                <CardHeader>
                    <CardTitle>Detalles Generales</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Cliente</label>
                        <Combobox
                            options={customers.map(c => ({ value: String(c.id), label: c.name }))}
                            value={formData.customerId}
                            onChange={(value) => setFormData({ ...formData, customerId: value })}
                            placeholder="Seleccione un cliente"
                            disabled={isEditMode}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Fecha de Emisión</label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            disabled={isEditMode}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/50 border-border backdrop-blur-sm relative z-10">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Calculator size={20} className="text-primary-400" />
                        Ítems
                    </CardTitle>
                    {!isEditMode && (
                        <Button variant="outline" size="sm" onClick={handleAddItem}>
                            <Plus className="w-4 h-4 mr-2" /> Agregar Item
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Producto/Descripción</TableHead>
                                <TableHead className="w-[10%] text-right">Cant.</TableHead>
                                <TableHead className="w-[15%] text-right">Precio Unit.</TableHead>
                                <TableHead className="w-[20%] text-right">Descuento</TableHead>
                                <TableHead className="w-[15%] text-right">Total</TableHead>
                                {!isEditMode && <TableHead className="w-[5%]"></TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.items.map((item, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {!isEditMode ? (
                                            <div className="space-y-2">
                                                <Combobox
                                                    options={products.map(p => ({
                                                        value: String(p.id),
                                                        label: `${p.code || ''} - ${p.name || p.description}`.trim()
                                                    }))}
                                                    value={item.productId}
                                                    onChange={(value) => handleProductSelect(index, value)}
                                                    placeholder="Buscar producto..."
                                                    className="w-full"
                                                />
                                                <Textarea
                                                    className="bg-background border-border text-foreground text-xs min-h-[60px] resize-y mt-1"
                                                    placeholder="Detalle adicional..."
                                                    value={item.description}
                                                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <span>{item.description}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            disabled={isEditMode}
                                            className="text-right"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                            disabled={isEditMode}
                                            className="text-right"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="bg-background border-border text-foreground text-right h-8 px-2 w-20 text-sm"
                                                value={item.discountValue}
                                                onChange={(e) => handleItemChange(index, 'discountValue', e.target.value)}
                                                disabled={isEditMode}
                                            />
                                            <select
                                                className="bg-background border border-border rounded text-foreground text-xs px-1 h-8 w-12"
                                                value={item.discountType}
                                                onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                                                disabled={isEditMode}
                                            >
                                                <option value="amount">$</option>
                                                <option value="percentage">%</option>
                                            </select>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        ${parseFloat(item.total).toFixed(2)}
                                    </TableCell>
                                    {!isEditMode && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="mt-6 flex justify-end">
                        <div className="w-1/2 md:w-1/3 space-y-3">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Subtotal Bruto:</span>
                                <span>${totals.subtotal.toFixed(2)}</span>
                            </div>

                            {totals.lineDiscounts > 0 && (
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>Descuentos por Línea:</span>
                                    <span>- ${totals.lineDiscounts.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center text-muted-foreground py-2 border-t border-border/50">
                                <span className="text-sm">Descuento Global:</span>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="bg-background border-border text-foreground text-right w-20 h-8"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                        disabled={isEditMode}
                                    />
                                    <select
                                        className="bg-background border border-border rounded text-foreground text-xs px-2 h-8"
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                        disabled={isEditMode}
                                    >
                                        <option value="amount">$</option>
                                        <option value="percentage">%</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between text-muted-foreground border-t border-border/50 pt-2">
                                <span>Subtotal Neto:</span>
                                <span>${totals.taxable.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="taxEnabled"
                                        checked={formData.taxEnabled}
                                        onChange={(e) => setFormData({ ...formData, taxEnabled: e.target.checked })}
                                        className="rounded border-border bg-background text-primary focus:ring-primary"
                                        disabled={isEditMode}
                                    />
                                    <label htmlFor="taxEnabled" className="cursor-pointer select-none text-sm">ITBMS</label>
                                    {formData.taxEnabled && (
                                        <div className="flex items-center gap-1 ml-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="bg-background border-border text-foreground text-right w-12 h-6 text-xs px-1"
                                                value={formData.taxRate}
                                                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                                disabled={isEditMode}
                                            />
                                            <span className="text-xs">%</span>
                                        </div>
                                    )}
                                </div>
                                <span>${totals.tax.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>${totals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
                <CardContent>
                    <Textarea
                        className="w-full min-h-[100px]"
                        placeholder="Notas adicionales..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        disabled={isEditMode}
                    />
                </CardContent>
            </Card>


        </div >
    );
}
