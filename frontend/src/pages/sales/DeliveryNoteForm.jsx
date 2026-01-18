import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as deliveryNoteService from '../../services/deliveryNoteService';
import * as customerService from '../../services/customerService';
import * as salesOrderService from '../../services/salesOrderService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Save, ArrowLeft } from 'lucide-react';
import { Combobox } from '../../components/ui/Combobox';
import { Textarea } from '../../components/ui/Textarea';

export default function DeliveryNoteForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { token, selectedCompany } = useAuth();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [salesOrders, setSalesOrders] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        customerId: '',
        salesOrderId: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        notes: ''
    });

    const isEditMode = !!id;

    useEffect(() => {
        if (selectedCompany) {
            loadDependencies();
            if (isEditMode) loadNote();

            // Check if redirected from SalesOrdersPage with a sourceOrderId
            const queryParams = new URLSearchParams(location.search);
            const sourceOrderId = queryParams.get('sourceOrderId');
            if (sourceOrderId && !isEditMode) {
                loadFromSalesOrder(sourceOrderId);
            }
        }
    }, [selectedCompany, id]);

    const loadDependencies = async () => {
        try {
            const custRes = await customerService.getCustomers({ limit: 100 });
            if (custRes.success) setCustomers(custRes.customers || []);

            // Load sales orders to allow selection
            const orderRes = await salesOrderService.getOrders(token, selectedCompany.id, { limit: 100 });
            if (orderRes.success) setSalesOrders(orderRes.orders || []);
        } catch (error) {
            console.error('Error loading dependencies:', error);
        }
    };

    const loadNote = async () => {
        setLoading(true);
        try {
            const response = await deliveryNoteService.getDeliveryNoteById(token, selectedCompany.id, id);
            if (response.success) {
                const note = response.deliveryNote;
                setFormData({
                    customerId: String(note.customerId || ''),
                    salesOrderId: String(note.salesOrderId || ''),
                    date: note.date,
                    items: note.items.map(i => ({
                        productId: i.productId || '',
                        description: i.description || i.product?.name || '',
                        quantity: i.quantity
                    })),
                    notes: note.notes || ''
                });
            }
        } catch (error) {
            console.error('Error loading note:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadFromSalesOrder = async (orderId) => {
        setLoading(true);
        try {
            const response = await salesOrderService.getOrderById(token, selectedCompany.id, orderId);
            if (response.success) {
                const order = response.order;
                setFormData(prev => ({
                    ...prev,
                    customerId: String(order.customerId || ''),
                    salesOrderId: String(order.id),
                    items: order.items.map(i => ({
                        productId: i.productId || '',
                        description: i.description || i.product?.name || '',
                        quantity: i.quantity
                    })),
                    notes: `Generado desde Factura ${order.orderNumber}`
                }));
            }
        } catch (error) {
            console.error('Error loading from sales order:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData(prev => ({ ...prev, items: newItems }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerId) return alert('Seleccione un cliente');
        if (formData.items.length === 0) return alert('Importe ítems desde una factura o seleccione un cliente con factura');

        setLoading(true);
        try {
            if (isEditMode) {
                await deliveryNoteService.updateDeliveryNote(token, selectedCompany.id, id, {
                    date: formData.date,
                    notes: formData.notes
                });
                alert('Nota de entrega actualizada exitosamente');
            } else {
                await deliveryNoteService.createDeliveryNote(token, selectedCompany.id, formData);
                alert('Nota de entrega creada exitosamente');
            }
            navigate('/delivery-notes');
        } catch (error) {
            console.error(error);
            alert('Error al guardar la nota de entrega');
        } finally {
            setLoading(false);
        }
    };

    const handleSalesOrderSelect = async (orderId) => {
        if (!orderId) {
            setFormData(prev => ({ ...prev, salesOrderId: '', items: [] }));
            return;
        }
        loadFromSalesOrder(orderId);
    };

    return (
        <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => navigate('/delivery-notes')}>
                        <ArrowLeft className="w-5 h-5 mr-2" /> Volver
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isEditMode ? 'Editar Nota de Entrega' : 'Nueva Nota de Entrega'}
                    </h1>
                </div>
                <div className="space-x-2">
                    <Button onClick={handleSubmit} disabled={loading} className="bg-primary hover:bg-primary/90 text-white font-semibold">
                        <Save className="w-4 h-4 mr-2" /> {isEditMode ? 'Actualizar Nota' : 'Guardar Nota'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 shadow-sm">
                    <CardHeader><CardTitle className="text-xl">Información General</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Cliente</label>
                                <Combobox
                                    options={customers.map(c => ({ value: String(c.id), label: c.name }))}
                                    value={formData.customerId}
                                    onChange={(val) => setFormData({ ...formData, customerId: val })}
                                    placeholder="Seleccionar cliente"
                                    disabled={isEditMode}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha</label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Importar desde Factura (Opcional)</label>
                            <Combobox
                                options={salesOrders
                                    .filter(o => !formData.customerId || String(o.customerId) === String(formData.customerId))
                                    .map(o => ({ value: String(o.id), label: `${o.orderNumber} - ${o.customer?.name}` }))}
                                value={formData.salesOrderId}
                                onChange={handleSalesOrderSelect}
                                placeholder="Seleccionar factura para copiar ítems"
                                disabled={isEditMode}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm">
                    <CardHeader><CardTitle className="text-xl">Observaciones</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea
                            placeholder="Instrucciones de entrega, destinatario, etc."
                            className="min-h-[120px] resize-none"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Ítems a Entregar</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow>
                                <TableHead className="font-bold">Descripción del Producto</TableHead>
                                <TableHead className="w-[150px] text-center font-bold">Cantidad</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-10 text-muted-foreground italic">
                                        No hay productos en esta entrega. Seleccione una factura para importar los ítems.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                formData.items.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-muted/10 transition-colors">
                                        <TableCell>
                                            <Input
                                                placeholder="Nombre o descripción del item..."
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                disabled={true}
                                                className="border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                className="text-center border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                disabled={true}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
