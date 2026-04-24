import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as quotationService from '../../services/quotationService';
import * as customerService from '../../services/customerService';
import * as companyService from '../../services/companyService';
import productService from '../../services/productService'; // Corrected import
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Calculator, History, Clock, User as UserIcon, Eye } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Combobox } from '../../components/ui/Combobox';
import { Textarea } from '../../components/ui/Textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { generateQuotationPDF } from '../../utils/QuotationPDF';

const DEFAULT_NOTES = `Término de pago: 50% contra orden de compra y restantes 50% contra entrega

Forma de pago: Cheque o contado a nombre de CBTECH Consulting Solutions Systems

CARLOS BAILEY / CBTECH CONSULTING SOLUTIONS SYSTEMS
BANCO GENERAL
Cuenta de Ahorro
04-38-99-085415-0`;

export default function QuotationForm() {
    // ... (imports/hooks)

    // ... inside component ...

    // Update useState to use constant

    const { token, selectedCompany } = useAuth();
    const [currentCompany, setCurrentCompany] = useState(null);
    const navigate = useNavigate();

    // Fetch fresh company data ensuring latest RUC/Phone
    useEffect(() => {
        const fetchCompanyData = async () => {
            if (selectedCompany?.id && token) {
                try {
                    const response = await companyService.getCompanyById(selectedCompany.id);
                    if (response.success) {
                        setCurrentCompany(response.data);
                    }
                } catch (error) {
                    console.error('Error fetching fresh company data:', error);
                    setCurrentCompany(selectedCompany); // Fallback
                }
            }
        };
        fetchCompanyData();
    }, [selectedCompany?.id, token]);
    const { id } = useParams();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]); // Added products state

    // ... (state definitions kept same, just ensuring useEffect is added)

    // INSERTING LOAD QUOTATION LOGIC HERE VIA REPLACE
    // We need to insert the function and the useEffect.
    // I will replace the start of the component to verify placement, 
    // but easier to append/insert after state.

    // Let's use a broader target.


    // Helper for local date string YYYY-MM-DD
    const getLocalDateString = (date = new Date()) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    const getFutureDateString = (days = 30) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return getLocalDateString(date);
    };

    const [formData, setFormData] = useState({
        customerId: '',
        date: getLocalDateString(),
        validUntil: getFutureDateString(30),
        notes: DEFAULT_NOTES,
        discountType: 'amount', // 'percentage' or 'amount'
        discountValue: 0,
        items: [
            {
                productId: '',
                description: '',
                quantity: 1,
                unitPrice: 0,
                discountType: 'amount',
                discountValue: 0,
                sku: '',
                total: 0
            }
        ],
        taxRate: 7,
        taxEnabled: true,
        status: 'draft'
    });

    // Add useEffect to enforce default if empty and not editing
    useEffect(() => {
        if (!id && !formData.notes) {
            setFormData(prev => ({ ...prev, notes: DEFAULT_NOTES }));
        }
    }, [id, formData.notes]);

    const [totals, setTotals] = useState({
        subtotal: 0,
        discount: 0,
        taxable: 0,
        tax: 0,
        retention: 0,
        total: 0,
        totalCost: 0,
        profit: 0
    });

    const [history, setHistory] = useState([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [viewingVersion, setViewingVersion] = useState(null);

    useEffect(() => {
        if (selectedCompany) {
            loadCustomers();
            loadProducts();
        }
    }, [selectedCompany]);

    useEffect(() => {
        if (isEditMode) {
            loadHistory();
        }
    }, [isEditMode, id]);

    const loadHistory = async () => {
        try {
            const response = await quotationService.getQuotationHistory(id);
            if (response.success) {
                setHistory(response.history);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        }
    };

    useEffect(() => {
        if (selectedCompany && id && token) {
            loadQuotation();
        }
    }, [selectedCompany, id, token]);

    const loadQuotation = async () => {
        try {
            setLoading(true);
            const response = await quotationService.getQuotationById(id);
            if (response.success && response.quotation) {
                const q = response.quotation;
                const items = q.items && q.items.length > 0 ? q.items.map(i => {
                    const qty = parseFloat(i.quantity) || 0;
                    const price = parseFloat(i.unitPrice) || 0;
                    let discount = 0;
                    if (i.discountType === 'percentage') {
                        discount = (qty * price) * (parseFloat(i.discountValue || 0) / 100);
                    } else {
                        discount = parseFloat(i.discountValue || 0);
                    }
                    return {
                        productId: i.productId || '',
                        description: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        discountType: i.discountType || 'amount',
                        discountValue: i.discountValue || 0,
                        sku: i.product?.sku || '',
                        total: (qty * price) - discount
                    };
                }) : [{
                    productId: '',
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    discountType: 'amount',
                    discountValue: 0,
                    total: 0
                }];

                setFormData({
                    number: q.number,
                    customerId: q.customerId,
                    date: q.date ? q.date.split('T')[0] : getLocalDateString(),
                    validUntil: q.validUntil ? q.validUntil.split('T')[0] : '',
                    notes: q.notes || '',
                    discountType: q.discountType || 'amount',
                    discountValue: q.discountValue || 0,
                    items: items,
                    taxRate: q.taxRate !== undefined ? parseFloat((parseFloat(q.taxRate) * 100).toFixed(2)) : 7, // Convert 0.07 to 7 and round
                    taxEnabled: q.taxRate !== undefined ? parseFloat(q.taxRate) > 0 : true,
                    status: q.status || 'draft'
                });
            }
        } catch (error) {
            console.error('Error loading quotation:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateTotals();
    }, [formData.items, formData.discountType, formData.discountValue, formData.taxRate, formData.taxEnabled]);

    const loadCustomers = async () => {
        try {
            const response = await customerService.getCustomers({ limit: 100, is_active: 'true' });
            if (response.success) {
                setCustomers(response.customers);
            }
        } catch (error) {
            console.error('Error loading customers:', error);
        }
    };

    const loadProducts = async () => {
        try {
            console.log('Loading products...');
            // Increase limit and add cache buster + explicit active filter
            const response = await productService.getProducts({ 
                limit: 1000, 
                is_active: 'true',
                _t: new Date().getTime() 
            });
            console.log('Products response:', response); // Debug log

            if (response.success) {
                // Backend returns { success: true, data: { products: [...] } }
                const productsData = response.data?.products || [];
                console.log('Products loaded:', productsData); // Debug log
                setProducts(productsData);
            } else {
                console.error('Failed to load products:', response);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const calculateTotals = () => {
        const customerMatch = String(formData.customerId);
        const customer = customers.find(c => String(c.id) === customerMatch);
        const isCustomerExempt = customer?.isTaxExempt === true;

        let grossItemsTotal = 0;
        let totalItemDiscounts = 0;
        let itemsTaxableBase = 0;
        let totalCost = 0;

        // 1. Calcular totales de línea, descuentos y base imponible por ítem
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

            const itemNet = itemGross - itemDiscount;
            grossItemsTotal += itemGross;
            totalItemDiscounts += itemDiscount;

            // Verificar si el producto es exento
            const product = products.find(p => String(p.id) === String(item.productId));
            const isProductExempt = product?.isTaxExempt === true;

            // Si ni el cliente ni el producto son exentos, se suma a la base imponible
            if (!isCustomerExempt && !isProductExempt) {
                itemsTaxableBase += itemNet;
            }

            // --- NUEVO: CÁLCULO DE COSTO ---
            const isService = product?.type === 'service';
            const productMargin = parseFloat(product?.margin || 0);
            
            let unitCost = parseFloat(product?.cost || item.unitCost || 0);
            // Regla: Si es servicio y el margen en catálogo es 0, el costo es 0 (ganancia 100%)
            if (isService && productMargin === 0) {
                unitCost = 0;
            }
            
            totalCost += unitCost * qty;
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

        // Prorratear descuento global sobre la base imponible si hay ítems mixtos
        // Esto asegura que el descuento se aplique proporcionalmente a la parte que paga impuestos
        const taxableRatio = netItemsTotal > 0 ? (itemsTaxableBase / netItemsTotal) : 0;
        const finalTaxableBase = Math.max(0, itemsTaxableBase - (globalDiscount * taxableRatio));

        const effectiveTaxRate = formData.taxEnabled ? (parseFloat(formData.taxRate) / 100) : 0;
        const tax = finalTaxableBase * effectiveTaxRate;

        // 4. Calcular Retención según Objeto de Retención del cliente
        let retention = 0;
        if (customer?.objetoRetencion && formData.taxEnabled) {
            const objRet = String(customer.objetoRetencion);
            if (objRet === '1' || objRet === '3') {
                retention = tax; // 100%
            } else if (objRet === '2' || objRet === '4' || objRet === '7') {
                retention = tax * 0.5; // 50%
            }
        }

        const total = (netItemsTotal - globalDiscount) + tax - retention;

        setTotals({
            subtotal: grossItemsTotal,
            lineDiscounts: totalItemDiscounts,
            globalDiscount: globalDiscount,
            totalSavings: totalDiscount,
            taxable: finalTaxableBase,
            tax,
            retention,
            totalCost: totalCost,
            profit: (netItemsTotal - globalDiscount) - totalCost,
            total: Math.max(0, total)
        });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        // Recalcular total visual de la línea
        const qty = parseFloat(newItems[index].quantity) || 0;
        const price = parseFloat(newItems[index].unitPrice) || 0;
        let discount = 0;

        if (newItems[index].discountType === 'percentage') {
            discount = (qty * price) * (parseFloat(newItems[index].discountValue) / 100);
        } else {
            discount = parseFloat(newItems[index].discountValue);
        }

        newItems[index].total = (qty * price) - discount;

        setFormData({ ...formData, items: newItems });
    };

    const handleProductSelect = (index, productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newItems = [...formData.items];
        newItems[index].productId = product.id;
        newItems[index].description = ''; // Leave empty to avoid duplication (PDF auto-adds product name)
        newItems[index].unitPrice = parseFloat(product.price) || 0;
        newItems[index].quantity = 1;
        newItems[index].sku = product.sku || ''; // Store SKU in item context

        // Recalculate total
        const qty = 1;
        const price = parseFloat(product.price) || 0;
        let discount = 0;
        // Reset discount on new product selection? Or keep? Reset seems safer.
        newItems[index].discountType = 'amount';
        newItems[index].discountValue = 0;
        newItems[index].total = qty * price;

        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                productId: '', // Add productId support
                description: '',
                quantity: 1,
                unitPrice: 0,
                discountType: 'amount',
                discountValue: 0,
                total: 0
            }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        if (newItems.length === 0) {
            // If deleting the last item, reset it to empty instead of removing
            setFormData({
                ...formData,
                items: [{
                    productId: '',
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    discountType: 'amount',
                    discountValue: 0,
                    total: 0
                }]
            });
        } else {
            setFormData({ ...formData, items: newItems });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerId) {
            alert('Por favor seleccione un cliente');
            return;
        }

        setLoading(true);
        try {
            // Preparar datos para el backend (incluyendo campos de descuento y posición)
            const payload = {
                ...formData,
                items: formData.items.map((item, index) => ({
                    ...item,
                    position: index
                })),
                discount: totals.discount, // Monto calculado del descuento global
                subtotal: totals.subtotal,
                tax: totals.tax,
                retention: totals.retention,
                total: totals.total,
                taxRate: formData.taxEnabled ? (parseFloat(formData.taxRate) / 100) : 0
            };

            let response;
            if (isEditMode) {
                response = await quotationService.updateQuotation(id, payload);
            } else {
                response = await quotationService.createQuotation(payload);
            }

            if (response.success) {
                navigate('/quotations');
            }
        } catch (error) {
            console.error('Error saving quotation:', error);
            alert('Error al guardar la cotización');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center gap-4 mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/quotations')}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                    <ArrowLeft size={24} />
                </Button>
                <h1 className="text-2xl font-bold text-foreground">
                    {isEditMode ? `Editar Cotización ${formData.number ? `- ${formData.number}` : ''}` : 'Nueva Cotización'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Cabecera */}
                <Card className="bg-card/50 border-border backdrop-blur-sm relative z-20">
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="space-y-2 md:col-span-6">
                            <label className="block text-sm font-medium text-muted-foreground">Cliente</label>
                            <Combobox
                                options={customers.map(c => ({ value: c.id, label: c.name }))}
                                value={formData.customerId}
                                onChange={(value) => {
                                    const customer = customers.find(c => String(c.id) === String(value));
                                    if (customer?.isTaxExempt) {
                                        setFormData({ 
                                            ...formData, 
                                            customerId: value,
                                            taxEnabled: false,
                                            taxRate: 0
                                        });
                                    } else {
                                        setFormData({ 
                                            ...formData, 
                                            customerId: value,
                                            taxEnabled: true,
                                            taxRate: 7
                                        });
                                    }
                                }}
                                placeholder="Seleccionar Cliente..."
                                searchPlaceholder="Buscar cliente..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-muted-foreground">Fecha Emisión</label>
                            <Input
                                type="date"
                                className="bg-background border-border text-foreground dark:[color-scheme:dark]"
                                value={formData.date}
                                onChange={(e) => {
                                    const newDate = e.target.value;
                                    // Calc new valid until
                                    let newValidUntil = formData.validUntil;
                                    if (newDate) {
                                        const d = new Date(newDate);
                                        d.setDate(d.getDate() + 30);
                                        // Helper for formatting
                                        const offset = d.getTimezoneOffset();
                                        const localD = new Date(d.getTime() - (offset * 60 * 1000));
                                        newValidUntil = localD.toISOString().split('T')[0];
                                    }
                                    setFormData({ ...formData, date: newDate, validUntil: newValidUntil });
                                }}
                                required
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground">Válida Hasta</label>
                            <Input
                                type="date"
                                className="bg-background border-border text-foreground dark:[color-scheme:dark]"
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-muted-foreground">Estado</label>
                            <select
                                className="w-full bg-background border border-border rounded-md h-10 px-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="draft">Borrador</option>
                                <option value="sent">Enviada</option>
                                <option value="accepted">Aceptada</option>
                                <option value="rejected">Rechazada</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Items */}
                <Card className="bg-card/50 border-border backdrop-blur-sm relative z-10">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Calculator size={20} className="text-primary-400" />
                            Items de la Cotización
                        </h3>

                        <div className="space-y-4">
                            {/* Desktop Table View */}
                            <div className="hidden md:block">
                                <table className="w-full mb-4">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left py-2 w-[60%] text-sm font-medium text-muted-foreground">Descripción</th>
                                            <th className="text-right py-2 w-[8%] text-sm font-medium text-muted-foreground">Cant.</th>
                                            <th className="text-right py-2 w-[12%] text-sm font-medium text-muted-foreground">Precio</th>
                                            <th className="text-right py-2 w-[10%] text-sm font-medium text-muted-foreground">Descuento</th>
                                            <th className="text-right py-2 w-[10%] text-sm font-medium text-muted-foreground">Total</th>
                                            <th className="w-[0%]"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {formData.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-2">
                                                    <Combobox
                                                        options={products.map(p => ({
                                                            value: p.id,
                                                            label: `${p.code || 'S/C'} ${p.sku ? '[' + p.sku + '] ' : ''}- ${p.description}`.trim()
                                                        }))}
                                                        value={item.productId}
                                                        onChange={(value) => handleProductSelect(index, value)}
                                                        placeholder="Buscar producto..."
                                                        className="w-full mb-1"
                                                    />
                                                    <Textarea
                                                        className="bg-background border-border text-foreground text-xs min-h-[60px] resize-y"
                                                        placeholder="Detalle adicional..."
                                                        value={item.description}
                                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                    />
                                                </td>
                                                <td className="py-2">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="bg-background border-border text-foreground text-right"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td className="py-2">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="bg-background border-border text-foreground text-right"
                                                        value={item.unitPrice}
                                                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td className="py-2">
                                                    <div className="flex items-center gap-1">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            className="bg-background border-border text-foreground text-right h-8 px-2 w-20 text-sm"
                                                            value={item.discountValue}
                                                            onChange={(e) => handleItemChange(index, 'discountValue', e.target.value)}
                                                        />
                                                        <select
                                                            className="bg-background border border-border rounded text-foreground text-xs px-1 h-8 outline-none"
                                                            value={item.discountType}
                                                            onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                                                        >
                                                            <option value="amount">$</option>
                                                            <option value="percentage">%</option>
                                                        </select>
                                                    </div>
                                                </td>
                                                <td className="py-2 text-right font-medium text-muted-foreground">
                                                    ${parseFloat(item.total).toFixed(2)}
                                                </td>
                                                <td className="py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-500 hover:text-red-700 bg-red-100 p-1 rounded-full transition-colors"
                                                        title="Eliminar línea"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Items Card View */}
                            <div className="md:hidden space-y-4">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="border border-border rounded-xl p-4 bg-muted/20 space-y-4 shadow-sm relative overflow-hidden">
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex-1">
                                                <Combobox
                                                    options={products.map(p => ({
                                                        value: p.id,
                                                        label: `${p.code || 'S/C'} ${p.sku ? '[' + p.sku + '] ' : ''}- ${p.description}`.trim()
                                                    }))}
                                                    value={item.productId}
                                                    onChange={(value) => handleProductSelect(index, value)}
                                                    placeholder="Buscar producto..."
                                                    className="w-full"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-destructive bg-destructive/10 p-2 rounded-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <Textarea
                                            className="bg-background border-border text-foreground text-sm min-h-[60px]"
                                            placeholder="Detalle adicional..."
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        />

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Cant.</label>
                                                <Input
                                                    type="number"
                                                    className="bg-background h-10"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Precio</label>
                                                <Input
                                                    type="number"
                                                    className="bg-background h-10"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase font-bold text-muted-foreground">Desc.</label>
                                                <div className="flex gap-1">
                                                    <Input
                                                        type="number"
                                                        className="bg-background h-10 flex-1"
                                                        value={item.discountValue}
                                                        onChange={(e) => handleItemChange(index, 'discountValue', e.target.value)}
                                                    />
                                                    <select
                                                        className="bg-background border border-border rounded h-10 px-1 text-xs"
                                                        value={item.discountType}
                                                        onChange={(e) => handleItemChange(index, 'discountType', e.target.value)}
                                                    >
                                                        <option value="amount">$</option>
                                                        <option value="percentage">%</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex flex-col justify-end items-end">
                                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Total</span>
                                                <span className="text-lg font-black text-primary">
                                                    ${parseFloat(item.total || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={addItem}
                            className="text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                            <Plus size={16} className="mr-2" />
                            Agregar Item
                        </Button>
                    </CardContent>
                </Card>

                {/* Totales y Notas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardContent className="p-6">
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Notas</label>
                            <Textarea
                                className="min-h-[150px]"
                                placeholder="Notas adicionales para la cotización..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 border-border backdrop-blur-sm">
                        <CardContent className="p-6 space-y-3">
                            <div className="flex justify-between text-muted-foreground font-medium">
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
                                <span className="text-sm">Descuento Global Comercial:</span>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="bg-background border-border text-foreground text-right w-24 h-8"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                    />
                                    <select
                                        className="bg-background border border-border rounded text-foreground text-xs px-2 h-8 outline-none focus:border-primary"
                                        value={formData.discountType}
                                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                    >
                                        <option value="amount">$</option>
                                        <option value="percentage">%</option>
                                    </select>
                                </div>
                            </div>

                            {/* Mostrar valor real del descuento global si aplica */}
                            {totals.globalDiscount > 0 && (
                                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                                    <span>(Valor Global Aplicado):</span>
                                    <span>- ${totals.globalDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {(totals.totalSavings > 0) && (
                                <div className="flex justify-between font-bold text-green-600 border-t border-border/50 pt-2 pb-2">
                                    <span>Total de Ahorro Cliente:</span>
                                    <span>${totals.totalSavings.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-muted-foreground font-medium pt-2 border-t border-border/50">
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
                                    />
                                    <label htmlFor="taxEnabled" className="cursor-pointer select-none">ITBMS</label>
                                    {formData.taxEnabled && (
                                        <div className="flex items-center gap-1 ml-2">
                                            <span className="text-xs">(</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="any"
                                                className="bg-background border-border text-foreground text-right w-12 h-6 text-xs px-1"
                                                value={formData.taxRate}
                                                onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val)) {
                                                        setFormData({ ...formData, taxRate: val.toFixed(2) });
                                                    }
                                                }}
                                            />
                                            <span className="text-xs">%)</span>
                                        </div>
                                    )}
                                    {!formData.taxEnabled && <span>(0%):</span>}
                                </div>
                                <span>${totals.tax.toFixed(2)}</span>
                            </div>

                            {totals.retention > 0 && (
                                <div className="flex justify-between text-amber-600 font-medium py-1 border-t border-border/30">
                                    <span className="text-sm">Retención ITBMS (-):</span>
                                    <span>- ${totals.retention.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="pt-3 border-t border-border flex justify-between text-xl font-bold text-foreground">
                                <span>{totals.retention > 0 ? 'Total a Recibir:' : 'Total:'}</span>
                                <span>${totals.total.toFixed(2)}</span>
                            </div>

                            <div className="pt-2 flex justify-between text-xs font-bold text-emerald-500 border-t border-emerald-500/20">
                                <span className="uppercase tracking-wider">Ganancia Proyectada:</span>
                                <span>${totals.profit.toFixed(2)} ({ (totals.subtotal - totals.discount) !== 0 ? (((totals.profit) / (totals.subtotal - totals.discount)) * 100).toFixed(1) : '0.0'}%)</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 pt-4">
                    {isEditMode && (
                        <div className="flex gap-2 mr-auto w-full md:w-auto">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsHistoryOpen(true)}
                                className="flex-1 md:flex-none bg-slate-100 text-slate-700 hover:bg-slate-200 h-12 md:h-10"
                            >
                                <History size={20} className="mr-2" />
                                Historial
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        const quotationData = {
                                            ...formData,
                                            ...totals,
                                            items: formData.items.map(item => {
                                                const product = products.find(p => p.id == item.productId); // Loose equality for safety
                                                return {
                                                    ...item,
                                                    productName: product ? product.description : '',
                                                    productCode: product ? product.code : '',
                                                    productSku: product ? product.sku : ''
                                                };
                                            }),
                                            customer: customers.find(c => c.id == formData.customerId)
                                        };
                                        // Use currentCompany (fresh) or selectedCompany (fallback) for PDF
                                        await generateQuotationPDF(quotationData, currentCompany || selectedCompany);
                                    } catch (error) {
                                        console.error('Error generating PDF:', error);
                                        alert(`Error al generar el PDF: ${error.message || error}`);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                className="flex-1 md:flex-none bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white h-12 md:h-10"
                            >
                                <Calculator size={20} className="mr-2" />
                                {loading ? 'Generando...' : 'Descargar PDF'}
                            </Button>
                        </div>
                    )}
                    <div className="flex gap-3 w-full md:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate('/quotations')}
                            className="flex-1 md:flex-none text-muted-foreground hover:text-foreground hover:bg-accent h-12 md:h-10"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 md:flex-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-12 md:h-10"
                        >
                            <Save size={20} className="mr-2" />
                            {loading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </div>
                </div>
            </form >

            {/* Modal de Historial */}
            <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-border max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <History className="text-primary" />
                            Historial de Cambios
                        </DialogTitle>
                        <DialogDescription>
                            Versiones guardadas antes de una edición.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                No hay cambios registrados todavía.
                            </div>
                        ) : (
                            history.map((version) => (
                                <div
                                    key={version.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-accent/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {version.version}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Clock size={14} className="text-muted-foreground" />
                                                {new Date(version.created_at).toLocaleString('es-ES', {
                                                    day: '2-digit', month: '2-digit', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <UserIcon size={12} />
                                                Editado por: {version.editor?.firstName} {version.editor?.lastName}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="text-sm font-bold text-foreground">
                                                ${parseFloat(version.data.total).toFixed(2)}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                {version.data.items?.length || 0} ITEMS
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setViewingVersion(version)}
                                            className="hover:bg-primary hover:text-white"
                                        >
                                            <Eye size={16} className="mr-1" />
                                            Ver
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Detalle de Versión */}
            <Dialog open={!!viewingVersion} onOpenChange={() => setViewingVersion(null)}>
                <DialogContent className="max-w-4xl bg-white dark:bg-slate-900 border-border max-h-[90vh] overflow-y-auto">
                    {viewingVersion && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-xl">
                                    Versión {viewingVersion.version} - {new Date(viewingVersion.created_at).toLocaleDateString()}
                                </DialogTitle>
                                <DialogDescription>
                                    Snapshot de la cotización tal como estaba en este momento.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="mt-6 space-y-6">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl">
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Subtotal</div>
                                        <div className="text-sm font-medium">${parseFloat(viewingVersion.data.subtotal).toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Descuento</div>
                                        <div className="text-sm font-medium">${parseFloat(viewingVersion.data.discount).toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">ITBMS</div>
                                        <div className="text-sm font-medium">${parseFloat(viewingVersion.data.tax).toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground text-primary">Total</div>
                                        <div className="text-sm font-bold text-primary">${parseFloat(viewingVersion.data.total).toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="border rounded-xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm min-w-[500px] sm:min-w-0">
                                        <thead className="bg-muted/50 border-b">
                                            <tr>
                                                <th className="text-left p-3">Descripción</th>
                                                <th className="text-right p-3 w-20">Cant.</th>
                                                <th className="text-right p-3 w-32">Precio</th>
                                                <th className="text-right p-3 w-32">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {viewingVersion.data.items?.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="p-3">{item.description || (item.product?.description) || 'Sin descripción'}</td>
                                                    <td className="p-3 text-right">{item.quantity}</td>
                                                    <td className="p-3 text-right">${parseFloat(item.unitPrice).toFixed(2)}</td>
                                                    <td className="p-3 text-right font-medium">${parseFloat(item.total).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {viewingVersion.data.notes && (
                                    <div className="space-y-2">
                                        <div className="text-[10px] uppercase font-bold text-muted-foreground">Notas de esta versión</div>
                                        <div className="p-4 bg-muted/20 rounded-xl text-sm whitespace-pre-wrap italic text-muted-foreground border border-border/50">
                                            {viewingVersion.data.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div >
    );
}
