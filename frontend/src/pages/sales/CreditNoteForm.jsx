import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { ArrowLeft, Save, Send, AlertTriangle, FileText, Trash2 } from 'lucide-react'; // Icons
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Combobox } from '../../components/ui/Combobox';
import { Label } from '../../components/ui/Label';
import { Textarea } from '../../components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/Table';

const CreditNoteForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { selectedCompany } = useAuth();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]); // List of eligible invoices
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        salesOrderId: '',
        refundType: 'full', // 'full' or 'partial'
        reason: '',
        notes: ''
    });

    const [items, setItems] = useState([]);
    const [totals, setTotals] = useState({ subtotal: 0, tax: 0, retention: 0, total: 0 });
    const [customerObjetoRetencion, setCustomerObjetoRetencion] = useState(null);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState(false); // If true, read-only view of existing CN

    // Load available orders (Invoices) on mount if creating
    useEffect(() => {
        if (selectedCompany && !isEditMode) {
            fetchEligibleOrders();
        }
        if (isEditMode && selectedCompany) {
            fetchCreditNote();
        }
    }, [selectedCompany, id]);

    // Recalculate totals when items or refund type changes
    useEffect(() => {
        calculateTotals();
    }, [items, formData.refundType]);

    const fetchEligibleOrders = async () => {
        try {
            console.log('Fetching eligible orders for company:', selectedCompany?.id);
            const response = await api.get('/sales-orders?status=fulfilled&limit=100&excludeCredited=true');
            const data = response.data;

            if (data.success) {
                setOrders(data.orders);
                if (data.orders.length === 0) {
                    console.warn('No fulfilled orders returned.');
                }
            } else {
                console.error('Failed to fetch orders:', data.error);
                setError('Error cargando facturas: ' + (data.error || 'Desconocido'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Error de conexión: ' + err.message);
        }
    };

    const fetchCreditNote = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/credit-notes/${id}`);
            const data = response.data;
            if (data.success) {
                const cn = data.creditNote;
                setFormData({
                    salesOrderId: cn.sales_order_id,
                    refundType: 'partial',
                    reason: cn.reason,
                    notes: '',
                    // View Mode specific
                    number: cn.number,
                    date: cn.date,
                    status: cn.status,
                    subtotal: cn.subtotal,
                    tax: cn.tax,
                    total: cn.total
                });
                
                setTotals({
                    subtotal: parseFloat(cn.subtotal),
                    tax: parseFloat(cn.tax),
                    retention: parseFloat(cn.retention || 0),
                    total: parseFloat(cn.total),
                    globalDiscount: 0
                });
                setItems(cn.items); // Items from JSONB
                setSelectedOrder(cn.salesOrder);
                setViewMode(true);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // When Invoice is Selected
    const handleOrderSelect = async (orderId) => {
        const order = orders.find(o => o.id == orderId);
        if (!order) return;

        setFormData(prev => ({ ...prev, salesOrderId: orderId }));

        try {
            const response = await api.get(`/sales-orders/${orderId}`);
            const data = response.data;
            if (data.success) {
                const fullOrder = data.order;
                setSelectedOrder(fullOrder);
                setCustomerObjetoRetencion(fullOrder.customer?.objeto_retencion_dgi);

                const mappedItems = fullOrder.items.map(item => ({
                    originalItemId: item.id,
                    productId: item.productId,
                    description: item.description || item.product?.name,
                    originalQuantity: parseFloat(item.quantity),
                    quantity: parseFloat(item.quantity),
                    unitPrice: parseFloat(item.unitPrice),
                    discount: parseFloat(item.discount || 0),
                    total: parseFloat(item.total),
                    taxRate: parseFloat(item.taxRate)
                }));
                setItems(mappedItems);
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar detalles de la factura: ' + err.message);
        }
    };

    const handleQuantityChange = (index, newQty) => {
        const updatedItems = [...items];
        const item = updatedItems[index];
        const qty = parseFloat(newQty) || 0;

        if (qty < 0) return;
        if (qty > item.originalQuantity) {
            alert(`La cantidad no puede exceder la original (${item.originalQuantity})`);
            return;
        }

        item.quantity = qty;
        // Recalculate item total: (Qty * UnitPrice) - (Discount prorated??)
        // Correct logic: Item Discount is usually fixed per line for the full qty. 
        // If returning partial qty, should we prorate discount? Yes.
        // Discount per Unit = TotalDiscount / OriginalQty
        const discountPerUnit = item.originalQuantity > 0 ? (item.discount / item.originalQuantity) : 0;
        const lineDiscount = discountPerUnit * qty;

        item.currentDiscount = lineDiscount; // Store specific discount for this calculation
        item.total = (qty * item.unitPrice) - lineDiscount;
        setItems(updatedItems);
    };

    const calculateTotals = () => {
        if (items.length === 0) {
            setTotals({ subtotal: 0, tax: 0, total: 0 });
            return;
        }

        let sub = 0;
        let tax = 0;

        items.forEach(item => {
            const qty = formData.refundType === 'full' ? item.originalQuantity : item.quantity;

            // Recalculate discount based on qty (if full, use full discount)
            const discountPerUnit = item.originalQuantity > 0 ? (item.discount / item.originalQuantity) : 0;
            const lineDiscount = discountPerUnit * qty;

            const lineGross = qty * item.unitPrice;
            const lineSub = lineGross - lineDiscount;
            const lineTax = lineSub * (item.taxRate !== undefined ? item.taxRate : 0.07); // Rate on Net

            sub += lineSub;
            tax += lineTax;
        });

        // Global Order Discount Handling?
        // If the original order had a global discount, we should strictly deduct it too if full refund.
        // But for now, let's stick to item-level accuracy effectively matching "Stored Total" logic.

        // Global Order Discount Handling
        // If full refund, deduct full global discount.
        // If partial, ideally prorate, but for now only deduct if full to ensure match.
        // We need selectedOrder to access discount.
        let globalDiscount = 0;
        if (selectedOrder && selectedOrder.discount && formData.refundType === 'full') {
            globalDiscount = parseFloat(selectedOrder.discount);
        } else if (selectedOrder && selectedOrder.discount && formData.refundType === 'partial') {
            // Prorate based on subtotal ratio?
            // ratio = sub / selectedOrder.subtotal
            const originalSub = parseFloat(selectedOrder.subtotal || 1);
            const ratio = sub / originalSub;
            globalDiscount = parseFloat(selectedOrder.discount) * ratio;
        }

        // ITBMS RETENTION logic
        let retention = 0;
        const objRet = String(customerObjetoRetencion);
        if (objRet === '1' || objRet === '3') {
            retention = tax; // 100% Retention
        } else if (['2', '4', '7'].includes(objRet)) {
            retention = tax * 0.5; // 50% Retention
        }

        setTotals({
            subtotal: sub,
            tax: tax,
            retention: retention,
            globalDiscount: globalDiscount,
            total: sub + tax - globalDiscount - retention
        });
    };

    const handleSubmit = async (action = 'create') => {
        setError('');
        if (!formData.salesOrderId) {
            setError('Seleccione una factura original');
            return;
        }
        if (!formData.reason) {
            setError('Debe indicar el motivo de la devolución');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                salesOrderId: formData.salesOrderId,
                refundType: formData.refundType,
                reason: formData.reason,
                items: items.filter(i => i.quantity > 0),
                retention: totals.retention
            };

            const response = await api.post('/credit-notes', payload);
            const data = response.data;
            if (!data.success) throw new Error(data.error);

            const creditNoteId = data.creditNote.id;

            if (action === 'emit') {
                const emitResponse = await api.post(`/credit-notes/${creditNoteId}/emit`);
                const emitData = emitResponse.data;
                if (!emitData.success) throw new Error(emitData.error);

                alert('Nota de Crédito emitida exitosamente');
            } else {
                alert('Borrador creado exitosamente');
            }

            navigate('/credit-notes');

        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Está seguro de que desea eliminar este borrador? Esta acción no se puede deshacer.')) return;

        try {
            setLoading(true);
            const response = await api.delete(`/credit-notes/${id}`);
            const data = response.data;
            if (!data.success) throw new Error(data.error);

            alert('Nota de crédito eliminada');
            navigate('/credit-notes');
        } catch (err) {
            setError(err.response?.data?.error || err.message);
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/credit-notes/${id}/download`, {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `NC_${formData.number}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (err) {
            alert('Error al descargar: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---

    if (viewMode) {
        return (
            <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Button variant="ghost" className="w-fit text-muted-foreground hover:text-foreground px-2" onClick={() => navigate('/credit-notes')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> <span className="hidden md:inline">Volver</span><span className="md:hidden text-xs">Atrás</span>
                    </Button>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {formData.status === 'draft' && (
                            <>
                                <Button onClick={() => handleSubmit('emit')} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 h-10 text-white font-bold">
                                    <Send className="mr-2 h-4 w-4" /> Emitir
                                </Button>
                                <Button onClick={handleDelete} variant="destructive" className="flex-1 md:flex-none h-10 font-bold">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </Button>
                            </>
                        )}
                        {formData.status === 'authorized' && (
                            <Button variant="outline" onClick={handleDownloadPDF} disabled={loading} className="w-full md:w-auto h-11 border-primary text-primary font-bold">
                                <FileText className="mr-2 h-4 w-4" /> {loading ? 'Descargando...' : 'Descargar PDF'}
                            </Button>
                        )}
                    </div>
                </div>

                <Card className="bg-card/50 backdrop-blur-sm border-border text-foreground shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
                        <div>
                            <CardTitle className="text-xl md:text-2xl font-black">{formData.number || 'Borrador'}</CardTitle>
                            <p className="text-muted-foreground text-xs md:text-sm mt-1 uppercase font-bold tracking-wider">
                                {formData.date ? new Date(formData.date).toLocaleDateString() : 'Fecha N/A'}
                            </p>
                        </div>
                        <Badge variant={formData.status === 'authorized' ? 'default' : 'secondary'} className="text-xs px-3 py-1 font-bold">
                            {formData.status === 'authorized' ? 'FISCALIZADA' : 'BORRADOR'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Header Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
                            <div className="p-4 md:p-6">
                                <h4 className="font-black text-[10px] uppercase text-muted-foreground mb-2">Cliente</h4>
                                <p className="text-base md:text-lg font-bold leading-tight">{selectedOrder?.customer?.name || 'N/A'}</p>
                                <p className="text-xs text-muted-foreground font-mono mt-1">{selectedOrder?.customer?.tax_id}</p>
                            </div>
                            <div className="p-4 md:p-6">
                                <h4 className="font-black text-[10px] uppercase text-muted-foreground mb-2">Factura Afectada</h4>
                                <p className="text-base md:text-lg font-bold">{selectedOrder?.orderNumber}</p>
                                <p className="text-xs text-muted-foreground font-medium mt-1">Emitida: {selectedOrder?.issueDate}</p>
                            </div>
                            <div className="p-4 md:p-6">
                                <h4 className="font-black text-[10px] uppercase text-muted-foreground mb-2">Motivo de Devolución</h4>
                                <p className="text-sm md:text-base italic font-medium leading-relaxed">"{formData.reason}"</p>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="border-t border-border/50 bg-muted/5">
                            <h3 className="px-4 md:px-6 py-4 font-black text-sm uppercase text-foreground">Productos Devueltos</h3>
                            
                            {/* Desktop Items Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead className="font-bold">Producto</TableHead>
                                            <TableHead className="text-right font-bold w-24">Cant.</TableHead>
                                            <TableHead className="text-right font-bold w-32">Precio Unit.</TableHead>
                                            <TableHead className="text-right font-bold w-32">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="font-medium">{item.description}</TableCell>
                                                <TableCell className="text-right font-bold">{item.quantity}</TableCell>
                                                <TableCell className="text-right text-muted-foreground font-mono">${Number(item.unitPrice).toFixed(2)}</TableCell>
                                                <TableCell className="text-right font-black text-primary font-mono">${Number(item.total).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Items Cards */}
                            <div className="md:hidden divide-y divide-border/50">
                                {items.map((item, index) => (
                                    <div key={index} className="p-4 flex gap-4 items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-foreground line-clamp-2">{item.description}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold mt-1">
                                                P. UNIT: <span className="font-mono">${Number(item.unitPrice).toFixed(2)}</span>
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[10px] uppercase font-black text-muted-foreground">Cant</p>
                                            <p className="text-lg font-black text-foreground">{item.quantity}</p>
                                            <p className="text-sm font-black text-primary font-mono leading-none mt-1">${Number(item.total).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="p-6 bg-muted/30 border-t border-border/50 rounded-b-lg">
                            <div className="flex flex-col gap-3 max-w-xs ml-auto">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">Subtotal</span>
                                    <span className="font-black">${totals.subtotal?.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground font-bold uppercase tracking-tighter">ITBMS</span>
                                    <span className="font-black">${totals.tax?.toFixed(2)}</span>
                                </div>
                                {totals.retention > 0 && (
                                    <div className="flex justify-between text-sm text-amber-600">
                                        <span className="font-bold uppercase tracking-tighter">Retención ITBMS (-)</span>
                                        <span className="font-mono font-black">-${totals.retention.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-border text-xl">
                                    <span className="text-primary font-black uppercase text-sm tracking-tighter">
                                        {totals.retention > 0 ? 'Total Neto' : 'Total'}
                                    </span>
                                    <span className="text-foreground font-black tracking-tighter leading-none">${totals.total?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Button variant="ghost" className="w-fit text-muted-foreground hover:text-foreground px-2" onClick={() => navigate('/credit-notes')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> <span className="hidden md:inline">Cancelar</span><span className="md:hidden text-xs">Cerrar</span>
                </Button>
                <h1 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Nueva Nota de Crédito</h1>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-start space-x-3 shadow-sm animate-pulse">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <h4 className="font-black text-xs uppercase tracking-tighter leading-none mb-1">Error de Proceso</h4>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <Card className="lg:col-span-1 border-border bg-card/50 backdrop-blur-sm shadow-sm h-fit">
                    <CardHeader className="pb-3"><CardTitle className="text-base md:text-lg font-bold">Configuración</CardTitle></CardHeader>
                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-black text-muted-foreground ml-1">Factura Original</Label>
                            <Combobox
                                options={orders.map(order => ({
                                    label: `${order.orderNumber} - ${order.customer?.name}`,
                                    value: String(order.id)
                                }))}
                                value={String(formData.salesOrderId)}
                                onChange={(val) => handleOrderSelect(val)}
                                placeholder="Seleccionar Factura..."
                                searchPlaceholder="Buscar factura..."
                                className="w-full h-11"
                                disabled={isEditMode}
                            />
                        </div>

                        {selectedOrder && (
                            <div className="space-y-5 animate-slideIn">
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm space-y-3">
                                    <div>
                                        <p className="text-[10px] uppercase font-black text-muted-foreground leading-none mb-1">Cliente</p>
                                        <p className="font-bold text-foreground leading-tight">{selectedOrder.customer?.name}</p>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-muted-foreground leading-none mb-1">Fecha Factura</p>
                                            <p className="font-bold text-foreground">{selectedOrder.issueDate}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-black text-muted-foreground leading-none mb-1">Monto Original</p>
                                            <p className="font-black text-primary">${selectedOrder.total}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-black text-muted-foreground ml-1">Tipo de Devolución</Label>
                                    <select
                                        className="flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm font-bold shadow-sm focus:ring-1 focus:ring-primary"
                                        value={formData.refundType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, refundType: e.target.value }))}
                                    >
                                        <option value="full">Devolución Total (100%)</option>
                                        <option value="partial">Devolución Parcial / Ajuste</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase font-black text-muted-foreground ml-1">Motivo de Devolución</Label>
                                    <Textarea
                                        placeholder="Indique la razón técnica o comercial..."
                                        className="bg-background border-input min-h-[100px] text-sm md:text-base font-medium"
                                        value={formData.reason}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Items and Totals Panel */}
                <Card className="lg:col-span-2 border-border bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                        <CardTitle className="text-base md:text-lg font-bold">Resumen de Devolución</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        {selectedOrder ? (
                            <div className="space-y-6">
                                {/* Desktop Items View */}
                                <div className="hidden md:block rounded-xl border border-border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="font-bold">Producto</TableHead>
                                                <TableHead className="text-right font-bold w-32">Cant. Devol.</TableHead>
                                                <TableHead className="text-right font-bold w-32">Precio</TableHead>
                                                <TableHead className="text-right font-bold w-24">Desc.</TableHead>
                                                <TableHead className="text-right font-bold w-32">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={index} className="border-border hover:bg-muted/5 transition-colors">
                                                    <TableCell className="font-medium text-sm">
                                                        {item.description}
                                                        <p className="text-[10px] text-muted-foreground font-medium">Orig: {item.originalQuantity}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {formData.refundType === 'partial' ? (
                                                            <div className="flex justify-end">
                                                                <Input
                                                                    type="number"
                                                                    className="h-10 w-24 text-right font-bold bg-muted/20"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                    min="0"
                                                                    max={item.originalQuantity}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="font-black text-primary">{item.originalQuantity}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">${item.unitPrice.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-red-500 font-mono text-sm">-${(item.currentDiscount || item.discount || 0).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-black text-foreground font-mono">
                                                        ${((item.quantity * item.unitPrice) - ((item.originalQuantity > 0 ? (item.discount / item.originalQuantity) : 0) * item.quantity)).toFixed(2)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Items View */}
                                <div className="md:hidden divide-y divide-border border-y border-border">
                                    {items.map((item, index) => (
                                        <div key={index} className="p-4 space-y-3 bg-muted/5">
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">{item.description}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase">Stock Facturado: {item.originalQuantity}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-black text-foreground font-mono leading-none">
                                                        ${((item.quantity * item.unitPrice) - ((item.originalQuantity > 0 ? (item.discount / item.originalQuantity) : 0) * item.quantity)).toFixed(2)}
                                                    </p>
                                                    <p className="text-[10px] text-red-500 font-bold mt-1 tracking-tighter">Desc: -${(item.currentDiscount || item.discount || 0).toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center gap-4 pt-1">
                                                <div className="text-xs text-muted-foreground font-medium">P. Unit: <span className="text-foreground">$ {item.unitPrice.toFixed(2)}</span></div>
                                                <div className="w-32">
                                                    {formData.refundType === 'partial' ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black uppercase text-muted-foreground">Dev:</span>
                                                            <Input
                                                                type="number"
                                                                className="h-9 w-full text-center font-black bg-white shadow-inner"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                min="0"
                                                                max={item.originalQuantity}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="text-right">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 leading-none">Devolviendo Todo</p>
                                                            <p className="text-lg font-black text-primary leading-none">{item.originalQuantity}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Calculations and Actions */}
                                <div className="p-4 md:p-0">
                                    <div className="flex flex-col gap-3 max-w-xs ml-auto mb-8">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-bold uppercase tracking-tighter">Subtotal Devol.</span>
                                            <span className="font-black">${totals.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground font-bold uppercase tracking-tighter">ITBMS</span>
                                            <span className="font-black">${totals.tax.toFixed(2)}</span>
                                        </div>
                                        {totals.globalDiscount > 0 && (
                                            <div className="flex justify-between text-sm text-red-500">
                                                <span className="font-bold uppercase tracking-tighter">Ajuste Descuento (-)</span>
                                                <span className="font-black">-${totals.globalDiscount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {totals.retention > 0 && (
                                            <div className="flex justify-between text-sm text-amber-600">
                                                <span className="font-bold uppercase tracking-tighter">Retención ITBMS (-)</span>
                                                <span className="font-mono font-black">-${totals.retention.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center pt-3 border-t-2 border-primary/20 text-xl font-black">
                                            <span className="text-primary uppercase text-xs tracking-tighter">NETO A DEVOLVER</span>
                                            <span className="text-foreground tracking-tighter leading-none">${totals.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-border pt-6">
                                        <Button variant="outline" className="w-full sm:w-auto h-11 border-border text-muted-foreground font-bold border-2" onClick={() => handleSubmit('create')} disabled={loading}>
                                            <Save className="mr-2 h-4 w-4" /> Guardar Borrador
                                        </Button>
                                        <Button className="w-full sm:w-auto h-11 bg-primary hover:bg-primary/90 text-white font-black text-base shadow-lg shadow-primary/20" onClick={() => handleSubmit('emit')} disabled={loading}>
                                            {loading ? 'Procesando...' : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" /> EMITIR FISCALMENTE
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 text-muted-foreground">
                                <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-inner">
                                    <FileText className="h-10 w-10 opacity-40" />
                                </div>
                                <h3 className="font-bold text-foreground">Sin Configuración</h3>
                                <p className="text-sm max-w-[200px] mx-auto mt-1">Seleccione una factura original del panel izquierdo para generar el resumen.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CreditNoteForm;
