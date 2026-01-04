import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
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
    const [totals, setTotals] = useState({ subtotal: 0, tax: 0, total: 0 });
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

            // Fix URL construction: Check if VITE_API_URL already contains '/api'
            const envUrl = import.meta.env.VITE_API_URL || '';
            // If envUrl is defined and ends with /api, don't duplicate it. 
            // If it's empty (dev proxy) or just domain, append /api.
            const urlPath = envUrl.endsWith('/api') ? '/sales-orders' : '/api/sales-orders';
            const url = `${envUrl}${urlPath}?status=fulfilled&limit=100`;

            console.log('Fetch URL:', url);

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'x-company-id': selectedCompany.id
                }
            });

            const data = await response.json();

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
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${baseUrl}/api/credit-notes/${id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'x-company-id': selectedCompany.id
                }
            });
            const data = await response.json();
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
                // Also set totals state for consistency if we reused the calculate logic, 
                // but for view mode we might just read from formData.
                // Let's update the check:
                setTotals({
                    subtotal: parseFloat(cn.subtotal),
                    tax: parseFloat(cn.tax),
                    total: parseFloat(cn.total),
                    globalDiscount: 0 // If we stored it? logic needed if we want to show it.
                });
                setItems(cn.items); // Items from JSONB
                setSelectedOrder(cn.salesOrder);
                setViewMode(true); // Always view mode if loading existing
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // When Invoice is Selected
    const handleOrderSelect = async (orderId) => {
        const order = orders.find(o => o.id == orderId); // careful with types
        if (!order) return;

        setFormData(prev => ({ ...prev, salesOrderId: orderId }));

        // Fetch full order details to get items
        try {
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${baseUrl}/api/sales-orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'x-company-id': selectedCompany.id
                }
            });
            const data = await response.json();
            if (data.success) {
                const fullOrder = data.order;
                setSelectedOrder(fullOrder);

                // Map items
                const mappedItems = fullOrder.items.map(item => ({
                    originalItemId: item.id,
                    productId: item.productId,
                    description: item.description || item.product?.name,
                    originalQuantity: parseFloat(item.quantity),
                    quantity: parseFloat(item.quantity), // Default to full
                    unitPrice: parseFloat(item.unitPrice),
                    discount: parseFloat(item.discount || 0),
                    total: parseFloat(item.total),
                    taxRate: parseFloat(item.taxRate)
                }));
                setItems(mappedItems);
            }
        } catch (err) {
            console.error(err);
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
            const lineTax = lineSub * (item.taxRate || 0.07); // Rate on Net

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

        setTotals({
            subtotal: sub,
            tax: tax,
            globalDiscount: globalDiscount,
            total: sub + tax - globalDiscount
        });
    };

    const handleSubmit = async (action = 'create') => { // 'create' (draft) or 'emit'
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

            // 1. Create Draft
            const payload = {
                salesOrderId: formData.salesOrderId,
                refundType: formData.refundType,
                reason: formData.reason,
                items: items.filter(i => i.quantity > 0) // Only send positive items if partial
            };

            const baseUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${baseUrl}/api/credit-notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'x-company-id': selectedCompany.id
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            const creditNoteId = data.creditNote.id;

            // 2. If Emit action
            if (action === 'emit') {
                const emitResponse = await fetch(`${baseUrl}/api/credit-notes/${creditNoteId}/emit`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'x-company-id': selectedCompany.id
                    }
                });
                const emitData = await emitResponse.json();
                if (!emitData.success) throw new Error(emitData.error);

                alert('Nota de Crédito emitida exitosamente');
            } else {
                alert('Borrador creado exitosamente');
            }

            navigate('/credit-notes');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Está seguro de que desea eliminar este borrador? Esta acción no se puede deshacer.')) return;

        try {
            setLoading(true);
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const response = await fetch(`${baseUrl}/api/credit-notes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'x-company-id': selectedCompany.id
                }
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            alert('Nota de crédito eliminada');
            navigate('/credit-notes');
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    // --- Render ---

    if (viewMode) {
        return (
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/credit-notes')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                    <div className="flex items-center gap-2">
                        {/* Actions for Draft */}
                        {formData.status === 'draft' && (
                            <>
                                <Button onClick={() => handleSubmit('emit')} className="bg-blue-600 hover:bg-blue-700">
                                    <Send className="mr-2 h-4 w-4" /> Emitir Fiscalmente
                                </Button>
                                <Button onClick={handleDelete} variant="destructive" className="ml-2">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </Button>
                            </>
                        )}
                        {/* Actions for Authorized (Placeholder for PDF) */}
                        {formData.status === 'authorized' && (
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" /> Descargar PDF
                            </Button>
                        )}
                    </div>
                </div>

                <Card className="bg-card border-border text-foreground">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">Nota de Crédito {formData.number || 'Borrador'}</CardTitle>
                            <p className="text-muted-foreground mt-1">
                                {formData.date ? new Date(formData.date).toLocaleDateString() : 'Fecha N/A'}
                            </p>
                        </div>
                        <Badge variant={formData.status === 'authorized' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                            {formData.status === 'authorized' ? 'Autorizada' : 'Borrador'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Header Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground">Cliente</h4>
                                <p className="text-lg">{selectedOrder?.customer?.name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{selectedOrder?.customer?.tax_id}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground">Factura Afectada</h4>
                                <p className="text-lg">{selectedOrder?.orderNumber}</p>
                                <p className="text-sm text-muted-foreground">Fecha: {selectedOrder?.issueDate}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm text-muted-foreground">Motivo</h4>
                                <p className="italic">"{formData.reason}"</p>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead className="text-right">Cant.</TableHead>
                                        <TableHead className="text-right">Precio Unit.</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">${Number(item.unitPrice).toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">${Number(item.total).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end space-x-8 text-lg font-bold border-t border-border pt-4 px-4">
                            <div className="text-muted-foreground">Subtotal: <span className="text-foreground">${totals.subtotal?.toFixed(2)}</span></div>
                            <div className="text-muted-foreground">ITBMS: <span className="text-foreground">${totals.tax?.toFixed(2)}</span></div>
                            <div className="text-primary">Total: ${totals.total?.toFixed(2)}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/credit-notes')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Nueva Nota de Crédito</h1>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md flex items-start space-x-2">
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Error</h4>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Panel: Configuration */}
                <Card className="md:col-span-1 bg-card border-border text-foreground h-fit">
                    <CardHeader><CardTitle className="text-lg">Configuración</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Factura Original</Label>
                            <Combobox
                                options={orders.map(order => ({
                                    label: `${order.orderNumber} - ${order.customer?.name}`,
                                    value: String(order.id)
                                }))}
                                value={String(formData.salesOrderId)}
                                onChange={(val) => handleOrderSelect(val)}
                                placeholder="Seleccionar Factura..."
                                searchPlaceholder="Buscar factura..."
                                className="w-full"
                                disabled={isEditMode}
                            />
                        </div>

                        {selectedOrder && (
                            <>
                                <div className="p-3 bg-muted rounded-md text-sm space-y-1">
                                    <p><span className="text-muted-foreground">Cliente:</span> {selectedOrder.customer?.name}</p>
                                    <p><span className="text-muted-foreground">Fecha:</span> {selectedOrder.issueDate}</p>
                                    <p><span className="text-muted-foreground">Total Factura:</span> ${selectedOrder.total}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipo de Devolución</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                        value={formData.refundType}
                                        onChange={(e) => setFormData(prev => ({ ...prev, refundType: e.target.value }))}
                                    >
                                        <option value="full">Devolución Total</option>
                                        <option value="partial">Ajuste Parcial</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Motivo</Label>
                                    <Textarea
                                        placeholder="Razón de la nota de crédito (Requerido)"
                                        className="bg-background border-input"
                                        value={formData.reason}
                                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel: Items Preview */}
                <Card className="md:col-span-2 bg-card border-border text-foreground">
                    <CardHeader><CardTitle className="text-lg">Ítems Afectados</CardTitle></CardHeader>
                    <CardContent>
                        {selectedOrder ? (
                            <div className="space-y-4">
                                <div className="rounded-md border border-border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow>
                                                <TableHead>Producto</TableHead>
                                                <TableHead className="text-right">Cant. Orig.</TableHead>
                                                <TableHead className="text-right">Cant. Devol.</TableHead>
                                                <TableHead className="text-right">Precio</TableHead>
                                                <TableHead className="text-right">Desc.</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((item, index) => (
                                                <TableRow key={index} className="border-border">
                                                    <TableCell>{item.description}</TableCell>
                                                    <TableCell className="text-right text-muted-foreground">{item.originalQuantity}</TableCell>
                                                    <TableCell className="text-right w-32">
                                                        {formData.refundType === 'partial' ? (
                                                            <Input
                                                                type="number"
                                                                className="h-8 w-24 ml-auto text-right bg-background"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                                                min="0"
                                                                max={item.originalQuantity}
                                                            />
                                                        ) : (
                                                            <span>{item.originalQuantity}</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">${item.unitPrice.toFixed(2)}</TableCell>
                                                    <TableCell className="text-right text-red-500">-${(item.currentDiscount || item.discount || 0).toFixed(2)}</TableCell>
                                                    <TableCell className="text-right font-mono hl-value">
                                                        {/* Dynamic Calculation for display matching logic */}
                                                        ${
                                                            ((item.quantity * item.unitPrice) -
                                                                ((item.originalQuantity > 0 ? (item.discount / item.originalQuantity) : 0) * item.quantity)).toFixed(2)
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="flex justify-end space-x-8 text-lg font-bold border-t border-border pt-4 px-4">
                                    <div className="text-muted-foreground">Subtotal: <span className="text-foreground">${totals.subtotal.toFixed(2)}</span></div>
                                    <div className="text-muted-foreground">ITBMS: <span className="text-foreground">${totals.tax.toFixed(2)}</span></div>
                                    {/* Global Discount Display */}
                                    {totals.globalDiscount > 0 && (
                                        <div className="text-red-500">Desc. General: -${totals.globalDiscount.toFixed(2)}</div>
                                    )}
                                    <div className="text-primary">Total: ${totals.total.toFixed(2)}</div>
                                </div>

                                <div className="flex justify-end space-x-3 pt-6">
                                    <Button variant="outline" className="border-input text-muted-foreground" onClick={() => handleSubmit('create')} disabled={loading}>
                                        <Save className="mr-2 h-4 w-4" /> Guardar Borrador
                                    </Button>
                                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => handleSubmit('emit')} disabled={loading}>
                                        {loading ? 'Procesando...' : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" /> Emitir Fiscalmente
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                <p>Seleccione una factura para comenzar</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CreditNoteForm;
