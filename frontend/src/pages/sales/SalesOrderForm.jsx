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
import { Plus, Trash2, Save, ArrowLeft, Send, Printer, Calculator, CreditCard, X } from 'lucide-react';
import paymentService from '../../services/paymentService';
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

    // Payment State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        method: 'ach',
        reference: '',
        notes: ''
    });
    const [submittingPayment, setSubmittingPayment] = useState(false);

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

                setFormData({
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
                            description: i.description || i.product?.name,
                            quantity: i.quantity,
                            unitPrice: i.unitPrice,
                            discountType: 'amount', // Defaulting to amount since specific type isn't stored per item
                            discountValue: parseFloat(i.discount) || 0,
                            total: i.total
                        };
                    }),
                    // Ensure these are set correct for display
                    paymentStatus: order.paymentStatus || 'unpaid',
                    paidAmount: parseFloat(order.paidAmount) || 0,
                    balance: parseFloat(order.balance) || 0,
                    payments: order.payments || [] // Store payments list
                });

                // Recalculate totals based on loaded items to ensure consistency
                // This call needs to be updated to match the calculateTotals signature if it was changed.
                // Assuming calculateTotals uses formData state, we just need to ensure formData is set first.
                // The original code already calls calculateTotals via useEffect after formData is set.
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

    const handleDownloadStatement = async (customer) => {
        // Prevent multiple clicks if needed, or simple loading toast
        if (!confirm(`¿Generar Estado de Cuenta para ${customer.name}?`)) return;

        try {
            const data = await paymentService.getStatement(token, selectedCompany.id, customer.id);
            if (data.success) {
                generateStatementPDF(data.data, selectedCompany);
            } else {
                alert('No se pudo obtener la información del estado de cuenta.');
            }
        } catch (error) {
            console.error(error);
            alert('Error al generar estado de cuenta');
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

    const handleRegisterPayment = async (e) => {
        e.preventDefault();
        setSubmittingPayment(true);
        try {
            await paymentService.createPayment(token, selectedCompany.id, {
                salesOrderId: id,
                customerId: formData.customerId,
                amount: parseFloat(paymentData.amount),
                method: paymentData.method,
                reference: paymentData.reference,
                notes: paymentData.notes
            });
            alert('Pago registrado exitosamente');
            setShowPaymentModal(false);
            setPaymentData({ amount: '', method: 'ach', reference: '', notes: '' });
            loadOrder(); // Reload to update balance
        } catch (error) {
            console.error('Payment Error:', error);
            alert('Error al registrar pago: ' + (error.message || 'Error desconocido'));
        } finally {
            setSubmittingPayment(false);
        }
    };

    const handleDeletePayment = async (payment) => {
        if (!confirm(`¿Está seguro de anular el pago ${payment.paymentNumber || ''} de $${payment.amount}? El saldo de la factura será actualizado.`)) return;

        try {
            await paymentService.deletePayment(token, selectedCompany.id, payment.id);
            alert('Pago eliminado exitosamente');
            loadOrder();
        } catch (error) {
            console.error('Delete Payment Error:', error);
            alert('Error al eliminar pago: ' + (error.message || 'Error desconocido'));
        }
    };

    const handleDelete = async () => {
        if (!confirm('¿Está seguro de eliminar esta factura? Esta acción no se puede deshacer.')) return;
        setLoading(true);
        try {
            // Fix URL construction: Check if VITE_API_URL already contains '/api'
            const envUrl = import.meta.env.VITE_API_URL || '';
            const urlPath = envUrl.endsWith('/api') ? '/sales-orders' : '/api/sales-orders';
            const url = `${envUrl}${urlPath}/${id}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-company-id': selectedCompany.id
                }
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            alert('Factura eliminada exitosamente');
            navigate('/sales-orders');
        } catch (error) {
            console.error(error);
            alert('Error al eliminar: ' + (error.message || 'Error desconocido'));
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
                    {isEditMode && formData.status !== 'draft' && formData.balance > 0 && (
                        <Button onClick={() => setShowPaymentModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                            <CreditCard className="w-4 h-4 mr-2" /> Registrar Pago
                        </Button>
                    )}
                    {isEditMode && (
                        <Button variant="outline" onClick={handleDownloadPdf}>
                            <Printer className="w-4 h-4 mr-2" /> PDF No Fiscal
                        </Button>
                    )}
                    {isEditMode && formData.status === 'draft' && (
                        <>
                            <Button onClick={handleDelete} variant="destructive" className="mr-2">
                                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </Button>
                            <Button
                                onClick={handleEmitFiscal}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Send className="w-4 h-4 mr-2" /> Emitir Fiscalmente
                            </Button>
                        </>
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

                            {isEditMode && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Pagado:</span>
                                        <span>${(formData.paidAmount || 0).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-red-600 mt-1">
                                        <span>Saldo Pendiente:</span>
                                        <span>${(formData.balance || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payments History Section */}
            {(isEditMode && formData.payments && formData.payments.length > 0) && (
                <Card>
                    <CardHeader><CardTitle>Historial de Pagos</CardTitle></CardHeader>
                    <CardContent>
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Código</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Método</TableHead>
                                        <TableHead>Referencia</TableHead>
                                        <TableHead>Notas</TableHead>
                                        <TableHead className="text-right">Monto</TableHead>
                                        <TableHead className="text-right w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {formData.payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-mono text-sm">{payment.paymentNumber || '-'}</TableCell>
                                            <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                                            <TableCell className="capitalize">{payment.method}</TableCell>
                                            <TableCell>{payment.reference || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground italic">{payment.notes || '-'}</TableCell>
                                            <TableCell className="text-right font-medium">${parseFloat(payment.amount).toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeletePayment(payment)}
                                                    title="Eliminar Pago"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

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




            {/* Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-background border border-border p-6 rounded-lg w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">Registrar Pago</h3>
                                <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-foreground">
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleRegisterPayment} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Monto a Pagar</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        max={formData.balance}
                                        required
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Saldo pendiente: ${parseFloat(formData.balance).toFixed(2)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Método</label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background/50"
                                        value={paymentData.method}
                                        onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                                    >
                                        <option value="ach">ACH / Transferencia</option>
                                        <option value="check">Cheque</option>
                                        <option value="cash">Efectivo</option>
                                        <option value="credit_card">Tarjeta Crédito</option>
                                        <option value="other">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Referencia / Nro. Cheque</label>
                                    <Input
                                        value={paymentData.reference}
                                        onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                        placeholder="Ej: ACH-12345"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Notas</label>
                                    <Textarea
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <Button type="button" variant="ghost" onClick={() => setShowPaymentModal(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={submittingPayment}>
                                        {submittingPayment ? 'Registrando...' : 'Confirmar Pago'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
